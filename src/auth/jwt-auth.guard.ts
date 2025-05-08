import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/decorator/customize';
import { adminV1Route } from 'src/core/admin.route';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // lấy ra metadata từ request
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request: Request = context.switchToHttp().getRequest();
    // Get method and url from request
    const method = request.method;
    const url = request.url;

    // URL in cyan
    const urlColor = '\x1b[36m'; // Cyan
    const resetColor = '\x1b[0m'; // Reset color

    console.log(
      `Request Method: ${getMethodColor(method)}${method}${resetColor}, ` +
        `Request URL: ${urlColor}${url}${resetColor}`,
    );

    // Check for authentication errors
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'Your token is invalid or header is missing token',
        )
      );
    }

    // Check if the route is an admin route
    const isAdminRoute = this.isAdminRoute(method, url);

    // If it's an admin route, verify the user has admin role
    if (isAdminRoute && user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return user;
  }

  // Helper method to check if a route is an admin route
  private isAdminRoute(method: string, url: string): boolean {
    // Clean up URL by removing query parameters
    const cleanUrl = url.split('?')[0];

    // Compare with admin routes
    return adminV1Route.some(
      (route) =>
        route.method.toLowerCase() === method.toLowerCase() &&
        this.urlMatchesPattern(cleanUrl, route.url),
    );
  }

  // Helper to match URLs with patterns (handles path params)
  private urlMatchesPattern(url: string, pattern: string): boolean {
    // Simple exact matching
    if (url === pattern) {
      return true;
    }

    // Convert pattern to regex to handle path parameters
    // e.g., '/api/v1/users/:id' will match '/api/v1/users/123'
    const regexPattern = pattern
      .replace(/:[^\/]+/g, '[^/]+') // Replace :paramName with regex for any character except /
      .replace(/\//g, '\\/'); // Escape forward slashes

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(url);
  }
}

// Different colors for different HTTP methods
const getMethodColor = (method: string): string => {
  switch (method.toUpperCase()) {
    case 'GET':
      return '\x1b[32m'; // Green
    case 'POST':
      return '\x1b[34m'; // Blue
    case 'PUT':
      return '\x1b[33m'; // Yellow
    case 'PATCH':
      return '\x1b[35m'; // Magenta
    case 'DELETE':
      return '\x1b[31m'; // Red
    default:
      return '\x1b[37m'; // White
  }
};
