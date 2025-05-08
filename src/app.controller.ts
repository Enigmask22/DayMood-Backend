import {
  Controller,
  Get,
  Render,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { Public } from './decorator/customize';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Version(VERSION_NEUTRAL)
  @Get() //  => api (restful)
  @Render('api')
  root() {
    return {
      title: 'Day Mood API',
      message: 'Welcome to the Day Mood API',
      apiDocs: [
        { version: '1', url: '/api/v1' },
        { version: '2', url: '/api/v2' },
      ],
    };
  }

  @Version('1') // => api/v1
  @Public()
  @Get() //  => api (restful)
  @Render('apiv1') // => view (html, ejs, ...)
  @ApiExcludeEndpoint()
  handleHomePage() {
    // port from .env
    console.log('>> check port = ', this.configService.get<string>('PORT'));
    const version = '1';
    const message = this.appService.getHelloVersion1(); // gọi đến service để lấy data
    return { message, version }; // truyền data vào view
    // return "this.appService.getHello()";
  }

  @Version('2') // => api/v2
  @Public()
  @Get() //  => api (restful)
  @Render('apiv2') // => view (html, ejs, ...)
  @ApiExcludeEndpoint()
  handleHomePage2() {
    // port from .env
    console.log('>> check port = ', this.configService.get<string>('PORT'));
    const version = '2';
    const message = this.appService.getHelloVersion2(); // gọi đến service để lấy data
    return { message, version }; // truyền data vào view
  }
}
