import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class checkValidId implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const id = request.params.id;

    // Check if the ID is a valid integer
    const isValidInteger = Number.isInteger(Number(id)) && Number(id) > 0;

    if (!isValidInteger) {
      throw new BadRequestException('ID must be a valid positive integer');
    }
    request.params.id = Number(id); // Convert to number for further processing

    return true;
  }
}
