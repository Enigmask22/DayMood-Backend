import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE } from 'src/decorator/customize';

export interface Response<T> {
  statusCode: number;
  message?: string;
  data: T;
}

// it will transform the response to the format we want
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  constructor(private reflector: Reflector) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();

    // Exclude EJS views and static asset requests from transformation
    const isStaticAsset =
      request.url.startsWith('/public/') || request.url.startsWith('/assets/');
    const isViewRoute =
      request.url.endsWith('.ejs') ||
      request.url.startsWith('/views/') ||
      (request.headers.accept && request.headers.accept.includes('text/html'));

    if (isStaticAsset || isViewRoute) {
      return next.handle(); // Don't transform for static files or views
    }
    return next.handle().pipe(
      map((data) => {
        // Lấy được response message từ request hiện tại
        const reqMessage =
          this.reflector.get<string>(RESPONSE_MESSAGE, context.getHandler()) ??
          '';

        return {
          statusCode: context.switchToHttp().getResponse().statusCode,
          message: reqMessage,
          data: data,
        };
      }),
    );
  }
}

// Common Swagger response schemas for reuse across controllers
export const ForbiddenResponseSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 403 },
    error: { type: 'string', example: 'Forbidden' },
    message: {
      type: 'string',
      example: 'You do not have permission to access this resource',
    },
  },
};

export const UnauthorizedResponseSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 401 },
    error: { type: 'string', example: 'Unauthorized' },
    message: {
      type: 'string',
      example: 'Your token is invalid or header is missing token',
    },
  },
};
