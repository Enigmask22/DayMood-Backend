import {
  createParamDecorator,
  SetMetadata,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import aqp from 'api-query-params';
import mongoose from 'mongoose';

// truyền thêm metadata vào lời gọi hàm
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true); // key:value

export const RESPONSE_MESSAGE = 'response_message';
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE, message);

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest().user,
);

// set up pagination info for the controller by Prisma
export const GetPaginateInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const currentPage = +req.query.page || 1;
    const limit = req.query.limit;
    const queryString = req.query;

    // Parse query params
    const { filter, sort } = aqp(queryString);

    // Extract custom projection from filter if available
    let projectionArray = [];
    if (filter.projection) {
      if (filter.projection.$in) projectionArray = filter.projection.$in;
      else projectionArray.push(filter.projection);
      delete filter.projection;
    }

    // Extract custom population from filter if available
    let populationArray = [];
    if (filter.population) {
      if (filter.population.$in) populationArray = filter.population.$in;
      else populationArray.push(filter.population);
      delete filter.population;
    }

    // projection and population cannot exist together
    if (projectionArray.length > 0 && populationArray.length > 0) {
      throw new BadRequestException(
        'Projection and population cannot be used together. Please choose one.',
      );
    }

    // Remove pagination params
    delete filter.page;
    delete filter.limit;

    // Calculate pagination values
    const defaultLimit = +limit || 10;
    const offset = (currentPage - 1) * defaultLimit;

    // Convert projection array to Prisma select object
    let select = {};
    if (projectionArray.length > 0) {
      // Filter out password field
      const safeProjections = projectionArray.filter(
        (field) => field !== 'password',
      );

      // Make sure we have at least one field after filtering
      if (safeProjections.length > 0) {
        // Apply remaining fields to select
        safeProjections.forEach((field) => {
          select[field] = true;
        });
      } else {
        throw new BadRequestException(
          'Projection must contain at least one field other than password.',
        );
      }
    }

    // Convert population array to Prisma include object
    let include = {};
    if (populationArray.length > 0) {
      populationArray.forEach((relation) => {
        include[relation] = true;
      });
    }

    // Convert MongoDB-style sorting to Prisma orderBy
    const orderBy = {};
    if (sort) {
      Object.keys(sort).forEach((key) => {
        orderBy[key] = sort[key] === 1 ? 'asc' : 'desc';
      });
    }

    // Transform filter for Prisma
    const where = transformFilterForPrisma(filter);

    return {
      // Basic pagination
      page: currentPage,
      // Prisma-specific fields
      skip: offset, // Prisma uses skip instead of offset
      take: defaultLimit, // Prisma uses take instead of limit
      where, // Transformed filter for Prisma
      orderBy, // Prisma sorting
      select, // Fields to include
      include, // Relations to include
    };
  },
);

// Helper function to transform MongoDB-style filters to Prisma where conditions
function transformFilterForPrisma(filter: any) {
  if (!filter || Object.keys(filter).length === 0) {
    return {};
  }

  const where = {};

  Object.keys(filter).forEach((key) => {
    if (typeof filter[key] === 'object') {
      // Handle MongoDB operators
      if (filter[key].$gt) {
        where[key] = { gt: filter[key].$gt };
      } else if (filter[key].$gte) {
        where[key] = { gte: filter[key].$gte };
      } else if (filter[key].$lt) {
        where[key] = { lt: filter[key].$lt };
      } else if (filter[key].$lte) {
        where[key] = { lte: filter[key].$lte };
      } else if (filter[key].$eq) {
        where[key] = filter[key].$eq;
      } else if (filter[key].$ne) {
        where[key] = { not: filter[key].$ne };
      } else if (filter[key].$in) {
        where[key] = { in: filter[key].$in };
      } else if (filter[key].$nin) {
        where[key] = { notIn: filter[key].$nin };
      } else if (filter[key].$regex) {
        where[key] = {
          contains: filter[key].$regex,
          mode: 'insensitive', // Case-insensitive search
        };
      }
    } else {
      // Simple equality
      where[key] = filter[key];
    }
  });

  return where;
}
