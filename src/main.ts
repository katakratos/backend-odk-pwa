import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.NODE_ENV === 'development' ? 'https://odkpwa.vercel.app' : '*',
    methods: ['GET', 'POST', 'DELETE'],
  });

  const config = new DocumentBuilder()
    .setTitle('API Collecte CNI')
    .setDescription('API de collecte de dossiers CNI')
    .setVersion('1.0')
    .addTag('collectes')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`API en écoute sur http://localhost:${port}`);
}
bootstrap();
