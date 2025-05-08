import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UniqueGmail implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const email = request.body.email;

    // Check if the email is unique
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (user) {
      throw new BadRequestException(
        `Email ${email} already exists. Please use a different email.`,
      );
    }
    return true;
  }
}
