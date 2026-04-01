import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

@Injectable()
export class R2Service {
  private readonly bucket: string;
  private readonly publicBaseUrl: string;
  private readonly client: S3Client;

  constructor(private readonly configService: ConfigService) {
    const r2 = this.configService.getOrThrow<{
      accessKeyId: string;
      secretAccessKey: string;
      endpoint: string;
      bucket: string;
      publicBaseUrl: string;
    }>('r2');

    this.bucket = r2.bucket;
    this.publicBaseUrl = r2.publicBaseUrl.replace(/\/$/, '');
    this.client = new S3Client({
      region: 'auto',
      endpoint: r2.endpoint,
      credentials: {
        accessKeyId: r2.accessKeyId,
        secretAccessKey: r2.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async uploadBuffer(params: {
    key: string;
    body: Buffer;
    contentType: string;
  }) {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
      },
    });

    await upload.done();

    return {
      key: params.key,
      url: `${this.publicBaseUrl}/${params.key}`,
    };
  }
}
