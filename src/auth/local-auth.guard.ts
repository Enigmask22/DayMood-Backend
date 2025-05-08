import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard, IAuthModuleOptions } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  getAuthenticateOptions(context: ExecutionContext) {
    return {
      usernameField: 'email',
      passwordField: 'password',
    };
  }
}
