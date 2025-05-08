export interface PaginateInfo {
  // Prisma specific fields
  page: number;         // Alias for currentPage
  skip: number;         // Prisma's equivalent to offset
  take: number;         // Prisma's equivalent to limit
  where: any;           // Transformed filter for Prisma queries
  orderBy: any;         // Transformed sort for Prisma
  select: any;          // Fields to include in the response
  include: any;         // Relations to include (joins)
}