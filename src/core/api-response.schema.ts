import { ApiProperty } from '@nestjs/swagger';

/**
 * Generic API response class for consistent response format
 * Used with Swagger documentation
 */
export class ApiResponse<T> {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data: T;
}

/**
 * Pagination metadata class for list responses
 */
export class PaginationMeta {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}

/**
 * Paginated response class for list endpoints
 */
export class PaginatedResponse<T> {
  @ApiProperty()
  meta: PaginationMeta;

  @ApiProperty({ isArray: true })
  items: T[];
}

/**
 * Common error response formats
 */
export const ErrorResponses = {
  Unauthorized: {
    description: 'Unauthorized - Invalid token or missing authentication',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        error: { type: 'string', example: 'Unauthorized' },
        message: { type: 'string', example: 'Your token is invalid or header is missing token' }
      }
    }
  },
  Forbidden: {
    description: 'Forbidden - User does not have admin permissions',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        error: { type: 'string', example: 'Forbidden resource' },
        message: { type: 'string', example: 'You do not have permission to access this resource' }
      }
    }
  },
  NotFound: {
    description: 'Not Found - Requested resource does not exist',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        error: { type: 'string', example: 'Resource not found' },
        message: { type: 'string', example: 'The requested resource could not be found' }
      }
    }
  },
  BadRequest: {
    description: 'Bad Request - Invalid parameters or request data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        error: { type: 'string', example: 'Bad Request' },
        message: { type: 'string', example: 'Invalid parameters provided' }
      }
    }
  }
}; 