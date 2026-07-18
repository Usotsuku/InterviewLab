import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const REQUIRED_SECRETS = ['DATABASE_URI', 'JWT_SECRET'];
  const missingSecrets = REQUIRED_SECRETS.filter((secret) => !process.env[secret]);
  if (missingSecrets.length > 0) {
    logger.error(`CRITICAL CONFIGURATION ERROR: Missing required secrets: ${missingSecrets.join(', ')}`);
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

  await app.register(await import('@fastify/multipart'), {
    limits: {
      fileSize: 10 * 1024 * 1024,
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

  app.enableCors();

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

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`InterviewLab Backend initialized on port ${port}`);
  logger.log(`API Swagger documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
