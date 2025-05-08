import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { TransformInterceptor } from './core/transform.interceptor';
import cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // config service for env
  const configService = app.get(ConfigService);

  // config validation pipe
  app.useGlobalPipes(new ValidationPipe());

  // truyền metadata vào lobal guard
  const reflector = app.get('Reflector');
  app.useGlobalGuards(new JwtAuthGuard(reflector));
  app.useGlobalInterceptors(new TransformInterceptor(reflector));

  // config cookie parser
  app.use(cookieParser());

  // config cors
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept',
    credentials: true,
  });

  // config versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ['1', '2'],
  });
  app.useStaticAssets(join(__dirname, '..', 'public')); // js, css, img, ...
  app.setBaseViewsDir(join(__dirname, '..', 'views')); // views
  app.setViewEngine('ejs');

  // config swagger
  const config = new DocumentBuilder()
    .setTitle('Day Mood API documentation')
    .setDescription('Restful API')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'Bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'token',
    )
    .addSecurityRequirements('token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(':version/swagger', app, document, {
    patchDocumentOnRequest: (req, _res, document) => {
      const version = (req as any).params.version;
      // set version for builder
      config.info.version = version;
      // NOTE: Make a deep copy of the original document or it will be modified on subsequent calls!
      const copyDocument = JSON.parse(JSON.stringify(document));
      const isValidVersion = /^v[0-9]+$/;
      if (!version || !isValidVersion.test(version)) {
        return;
      }
      for (const route in document.paths) {
        if (route.startsWith(`/api/${version}`)) {
          continue;
        }
        delete copyDocument.paths[route];
      }
      return copyDocument;
    },
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // start server at port ${PORT}
  await app.listen(8000, '0.0.0.0');
}
bootstrap();
