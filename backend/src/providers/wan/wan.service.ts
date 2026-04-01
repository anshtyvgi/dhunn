import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface WanSubmitResponse {
  id: string;
  status: string;
  pollUrl?: string;
}

@Injectable()
export class WanService {
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
    const result = await this.pollResult(submit.id);

    const outputUrl = this.extractOutputUrl(result);
    if (!outputUrl) {
      throw new InternalServerErrorException(
        'WAN completed without returning an audio asset',
      );
    }

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

    if (!response.ok) {
      throw new InternalServerErrorException(
        `WAN submit failed: ${response.status} ${await response.text()}`,
      );
    }

    const data = await response.json() as Record<string, unknown>;
    const id = (data.id ?? data.task_id ?? (data as any).data?.id) as string | undefined;
    if (!id) {
      throw new InternalServerErrorException(
        `WAN submit returned no task ID: ${JSON.stringify(data).slice(0, 500)}`,
      );
    }

    // Use the poll URL from the response if available
    const pollUrl = (data as any).urls?.get as string | undefined;
    return { id, status: String(data.status ?? 'created'), pollUrl };
  }

  private async pollResult(taskId: string) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < this.timeoutMs) {
      const statusResponse = await fetch(`${this.baseUrl}/predictions/${taskId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!statusResponse.ok) {
        throw new InternalServerErrorException(
          `WAN poll failed: ${statusResponse.status} ${await statusResponse.text()}`,
        );
      }

      const status = (await statusResponse.json()) as Record<string, unknown>;
      if (status.status === 'completed') {
        const resultResponse = await fetch(
          `${this.baseUrl}/predictions/${taskId}/result`,
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
            },
          },
        );

        if (!resultResponse.ok) {
          throw new InternalServerErrorException(
            `WAN result fetch failed: ${resultResponse.status} ${await resultResponse.text()}`,
          );
        }

        return (await resultResponse.json()) as Record<string, unknown>;
      }

      if (status.status === 'failed' || status.status === 'canceled') {
        throw new InternalServerErrorException(
          `WAN prediction failed for task ${taskId}`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, this.intervalMs));
    }

    throw new InternalServerErrorException(
      `WAN prediction timed out for task ${taskId}`,
    );
  }

  private extractOutputUrl(result: Record<string, unknown>) {
    if (Array.isArray(result.outputs) && typeof result.outputs[0] === 'string') {
      return result.outputs[0];
    }

    if (typeof result.output === 'string') {
      return result.output;
    }

    if (
      result.output &&
      typeof result.output === 'object' &&
      'url' in result.output &&
      typeof result.output.url === 'string'
    ) {
      return result.output.url;
    }

    if (typeof result.audio_url === 'string') {
      return result.audio_url;
    }

    return null;
  }
}
