// src/users/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService; // Khai báo biến cho mock PrismaService

  // Mock PrismaService hoặc các dependency khác
  const mockPrismaService = {
    // Thêm các phương thức bạn cần mock ở đây, ví dụ:
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      // ... các phương thức khác
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService, // Cung cấp mock thay vì PrismaService thật
          useValue: mockPrismaService,
        },
        // Thêm các provider mock khác nếu UsersService có dependency khác
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService); // Lấy instance của mock
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // === Viết các test case của bạn ở đây ===

  // Ví dụ test cho một phương thức (giả sử có findOne)
  describe('findOne', () => {
    it('should return a user if found', async () => {
      const userId = 1;
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser' /* ... other fields */,
      };

      // Giả lập mockPrismaService.user.findUnique trả về mockUser
      mockPrismaService.user.findFirst = jest.fn().mockResolvedValue(mockUser); // Sửa thành findFirst nếu service dùng findFirst

      const result = await service.findOne(userId);
      expect(result).toEqual(mockUser);
      // Kiểm tra xem phương thức mock có được gọi đúng không
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.any(Object),
      }); // Kiểm tra cả phần select nếu có
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 999;
      // Giả lập mockPrismaService.user.findUnique trả về null
      mockPrismaService.user.findFirst = jest.fn().mockResolvedValue(null);

      // Kiểm tra xem service có ném ra lỗi HttpException không
      await expect(service.findOne(userId)).rejects.toThrow('User not found');
      // Có thể kiểm tra cụ thể hơn là HttpException với status NOT_FOUND nếu cần
      // await expect(service.findOne(userId)).rejects.toThrow(HttpException);

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.any(Object),
      });
    });
  });

  // Thêm các describe và it khác cho các phương thức khác của UsersService...
});
