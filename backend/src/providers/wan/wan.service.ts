import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface WanSubmitResponse {
  id: string;
  status: string;
}

@Injectable()
export class WanService {
  private readonly logger = new Logger(WanService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly modelPath: string;
  private readonly timeoutMs: number;
  private readonly intervalMs: number;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('wanApiKey');
    this.baseUrl = this.configService
      .getOrThrow<string>('wanBaseUrl')
      .replace(/\/$/, '');
    this.modelPath = this.configService.getOrThrow<string>('wanAudioModel');
    const polling = this.configService.getOrThrow<{
      timeoutMs: number;
      intervalMs: number;
    }>('polling');
    this.timeoutMs = polling.timeoutMs;
    this.intervalMs = polling.intervalMs;
  }

  async generateAudio(params: {
    lyrics: string;
    tags: string[];
    durationSeconds?: number;
  }) {
    const submit = await this.submitPrediction(params);
    this.logger.log(`WAN task submitted: ${submit.id}`);

    const result = await this.pollResult(submit.id);

    const outputUrl = this.extractOutputUrl(result);
    if (!outputUrl) {
      this.logger.error(`WAN completed but no output URL found in: ${JSON.stringify(result).slice(0, 500)}`);
      throw new InternalServerErrorException(
        'WAN completed without returning an audio asset',
      );
    }

    this.logger.log(`Downloading audio from: ${outputUrl}`);
    const response = await fetch(outputUrl);
    if (!response.ok) {
      throw new InternalServerErrorException(
        `Failed to download WAN audio asset: ${response.status}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    return {
      taskId: submit.id,
      buffer: Buffer.from(arrayBuffer),
      mimeType: response.headers.get('content-type') ?? 'audio/mpeg',
      sourceUrl: outputUrl,
    };
  }

  private async submitPrediction(params: {
    lyrics: string;
    tags: string[];
    durationSeconds?: number;
  }): Promise<WanSubmitResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/${this.modelPath}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration: params.durationSeconds ?? 60,
          lyrics: params.lyrics,
          tags: params.tags.join(', '),
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw new InternalServerErrorException('WAN submit timed out');
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    // Retry on 429 (rate limit)
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('retry-after') ?? '30', 10);
      const waitMs = Math.min(retryAfter * 1000, 60000);
      this.logger.warn(`WAN 429 rate limited, waiting ${waitMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));

      const retryController = new AbortController();
      const retryTimeout = setTimeout(() => retryController.abort(), 60000);
      try {
        response = await fetch(`${this.baseUrl}/${this.modelPath}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            duration: params.durationSeconds ?? 60,
            lyrics: params.lyrics,
            tags: params.tags.join(', '),
          }),
          signal: retryController.signal,
        });
      } finally {
        clearTimeout(retryTimeout);
      }
    }

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`WAN submit failed: ${response.status} ${body}`);
      throw new InternalServerErrorException(
        `WAN submit failed: ${response.status} ${body}`,
      );
    }

    const data = (await response.json()) as Record<string, unknown>;
    this.logger.log(`WAN submit response: ${JSON.stringify(data).slice(0, 300)}`);

    const id = (data.id ?? data.task_id ?? (data as any).data?.id) as string | undefined;
    if (!id) {
      throw new InternalServerErrorException(
        `WAN submit returned no task ID: ${JSON.stringify(data).slice(0, 500)}`,
      );
    }

    return { id, status: String(data.status ?? 'created') };
  }

  private async pollResult(taskId: string): Promise<Record<string, unknown>> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < this.timeoutMs) {
      const statusResponse = await fetch(
        `${this.baseUrl}/predictions/${taskId}/result`,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        },
      );

      if (!statusResponse.ok) {
        // Non-200 on poll is not fatal — might just not be ready yet
        if (statusResponse.status === 404 || statusResponse.status === 202) {
          await new Promise((resolve) => setTimeout(resolve, this.intervalMs));
          continue;
        }
        throw new InternalServerErrorException(
          `WAN poll failed: ${statusResponse.status} ${await statusResponse.text()}`,
        );
      }

      const data = (await statusResponse.json()) as Record<string, unknown>;
      this.logger.log(`WAN poll ${taskId}: status=${data.status}`);

      if (data.status === 'completed') {
        // The response itself contains outputs — use it directly
        return data;
      }

      if (data.status === 'failed' || data.status === 'canceled') {
        const errMsg = (data.error as string) ?? `WAN prediction ${data.status}`;
        throw new InternalServerErrorException(
          `WAN prediction failed for task ${taskId}: ${errMsg}`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, this.intervalMs));
    }

    throw new InternalServerErrorException(
      `WAN prediction timed out for task ${taskId} after ${this.timeoutMs}ms`,
    );
  }

  private extractOutputUrl(result: Record<string, unknown>): string | null {
    // outputs: ["https://...mp3"]
    if (Array.isArray(result.outputs) && typeof result.outputs[0] === 'string') {
      return result.outputs[0];
    }

    // output: "https://..."
    if (typeof result.output === 'string') {
      return result.output;
    }

    // output: { url: "https://..." }
    if (
      result.output &&
      typeof result.output === 'object' &&
      'url' in result.output &&
      typeof (result.output as Record<string, unknown>).url === 'string'
    ) {
      return (result.output as Record<string, unknown>).url as string;
    }

    // audio_url: "https://..."
    if (typeof result.audio_url === 'string') {
      return result.audio_url;
    }

    return null;
  }
}
