import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHelloVersion1(): string {
    return 'This is version 1 of the API.';
  }

  getHelloVersion2(): string {
    return 'This version will be developed soon.';
  }
}
