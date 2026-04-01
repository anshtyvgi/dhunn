import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  const configService = app.get(ConfigService);
  const prismaService = app.get(PrismaService);

  app.setGlobalPrefix(configService.getOrThrow<string>('apiPrefix'));

  const frontendUrl = configService.get<string>('frontendUrl');
  app.enableCors({
    origin: frontendUrl ? [frontendUrl] : true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  await prismaService.enableShutdownHooks(app);
  await app.listen(configService.getOrThrow<number>('port'));
}

bootstrap();
