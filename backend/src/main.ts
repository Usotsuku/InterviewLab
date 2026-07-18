import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const isProduction = process.env.NODE_ENV === 'production';

  const REQUIRED_SECRETS = ['DATABASE_URI', 'JWT_SECRET', 'GEMINI_API_KEY'];
  const missingSecrets = REQUIRED_SECRETS.filter((secret) => !process.env[secret]);
  if (missingSecrets.length > 0) {
    logger.error(
      `CRITICAL CONFIGURATION ERROR: Missing required configuration: ${missingSecrets.join(', ')}`,
    );
    process.exit(1);
  }

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: {
        level: process.env.LOG_LEVEL || 'info',
      },
    }),
  );

  app.useWebSocketAdapter(new IoAdapter(app));

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });
  await app.register(compress, { global: true, threshold: 1024 });

  const uploadMaxBytes =
    parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB || '10', 10) * 1024 * 1024;

  await app.register(await import('@fastify/multipart'), {
    limits: {
      fileSize: uploadMaxBytes,
    },
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigin = ((): string | string[] => {
    if (process.env.CORS_ORIGIN) {
      return process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
    }
    if (process.env.NODE_ENV === 'production') {
      logger.error(
        'CRITICAL CONFIGURATION ERROR: Missing required configuration: CORS_ORIGIN (required in production)',
      );
      process.exit(1);
    }
    return ['http://localhost:4200'];
  })();

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('InterviewLab API')
      .setDescription('AI-powered interview preparation platform API contracts')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentication routes')
      .addTag('Users', 'User profile endpoints')
      .addTag('Candidate Profile', 'Candidate CV profile metadata')
      .addTag('CV', 'CV upload management')
      .addTag('Interviews', 'Session management routes')
      .addTag('Questions', 'Session question queries')
      .addTag('Answers', 'Voice answer submission')
      .addTag('Notifications', 'Notification feeds')
      .addTag('Settings', 'User account settings')
      .addTag('Health', 'Connectivity diagnostics')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`InterviewLab Backend initialized on port ${port}`);
  if (!isProduction) {
    logger.log(`API Swagger documentation available at http://localhost:${port}/api/docs`);
  }
}

bootstrap();
