import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
    const taskId = await this.submitPrediction(params);
    this.logger.log(`WAN task submitted: ${taskId}`);

    const result = await this.pollUntilDone(taskId);

    const outputUrl = this.extractOutputUrl(result);
    if (!outputUrl) {
      this.logger.error(`No output URL in: ${JSON.stringify(result).slice(0, 500)}`);
      throw new InternalServerErrorException(
        'WAN completed without returning an audio asset',
      );
    }

    this.logger.log(`Downloading audio from: ${outputUrl}`);
    const response = await fetch(outputUrl);
    if (!response.ok) {
      throw new InternalServerErrorException(
        `Failed to download WAN audio: ${response.status}`,
      );
    }

    return {
      taskId,
      buffer: Buffer.from(await response.arrayBuffer()),
      mimeType: response.headers.get('content-type') ?? 'audio/mpeg',
      sourceUrl: outputUrl,
    };
  }

  private async submitPrediction(params: {
    lyrics: string;
    tags: string[];
    durationSeconds?: number;
  }): Promise<string> {
    const body = JSON.stringify({
      duration: params.durationSeconds ?? 60,
      lyrics: params.lyrics,
      tags: params.tags.join(', '),
    });

    let response = await this.fetchWithTimeout(
      `${this.baseUrl}/${this.modelPath}`,
      { method: 'POST', headers: this.authHeaders({ 'Content-Type': 'application/json' }), body },
      60000,
    );

    // Retry on 429
    if (response.status === 429) {
      const wait = Math.min(parseInt(response.headers.get('retry-after') ?? '30', 10) * 1000, 60000);
      this.logger.warn(`WAN 429, waiting ${wait}ms`);
      await this.sleep(wait);
      response = await this.fetchWithTimeout(
        `${this.baseUrl}/${this.modelPath}`,
        { method: 'POST', headers: this.authHeaders({ 'Content-Type': 'application/json' }), body },
        60000,
      );
    }

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`WAN submit failed: ${response.status} ${text}`);
      throw new InternalServerErrorException(`WAN submit failed: ${response.status} ${text}`);
    }

    const raw = (await response.json()) as Record<string, unknown>;
    this.logger.log(`WAN submit response: ${JSON.stringify(raw).slice(0, 500)}`);
    // WAN wraps response under "data" key: { code: 200, data: { id: "...", ... } }
    const data = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as Record<string, unknown>;

    const id = (data.id ?? data.task_id ?? raw.id) as string | undefined;
    if (!id) {
      throw new InternalServerErrorException(
        `WAN returned no task ID: ${JSON.stringify(data).slice(0, 500)}`,
      );
    }
    return id;
  }

  /**
   * Poll GET /predictions/{id} until status is "completed" or "failed".
   * The completed response itself contains the outputs array.
   */
  private async pollUntilDone(taskId: string): Promise<Record<string, unknown>> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < this.timeoutMs) {
      const response = await fetch(`${this.baseUrl}/predictions/${taskId}`, {
        headers: this.authHeaders(),
      });

      if (!response.ok) {
        // 404 = not ready yet on some providers
        if (response.status === 404) {
          await this.sleep(this.intervalMs);
          continue;
        }
        throw new InternalServerErrorException(
          `WAN poll failed: ${response.status} ${await response.text()}`,
        );
      }

      const raw = (await response.json()) as Record<string, unknown>;
      // WAN API may nest the actual result under "data" key
      const data = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as Record<string, unknown>;
      const status = String(data.status ?? raw.status ?? '');
      this.logger.log(`WAN poll ${taskId}: status=${status}, raw keys=${Object.keys(raw).join(',')}`);

      if (status === 'completed') {
        return data;
      }

      if (status === 'failed' || status === 'canceled') {
        throw new InternalServerErrorException(
          `WAN task ${taskId} ${status}: ${data.error ?? raw.error ?? 'unknown error'}`,
        );
      }

      // processing / queued / starting — wait and retry
      await this.sleep(this.intervalMs);
    }

    throw new InternalServerErrorException(
      `WAN task ${taskId} timed out after ${this.timeoutMs}ms`,
    );
  }

  private extractOutputUrl(result: Record<string, unknown>): string | null {
    // outputs: ["https://...mp3"]
    if (Array.isArray(result.outputs) && typeof result.outputs[0] === 'string') {
      return result.outputs[0];
    }
    if (typeof result.output === 'string') {
      return result.output;
    }
    if (typeof result.audio_url === 'string') {
      return result.audio_url;
    }
    return null;
  }

  private authHeaders(extra: Record<string, string> = {}): Record<string, string> {
    return { Authorization: `Bearer ${this.apiKey}`, ...extra };
  }

  private async fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw new InternalServerErrorException(`Request timed out: ${url}`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
