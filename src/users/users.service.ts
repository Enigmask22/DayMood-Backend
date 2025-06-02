import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { genSaltSync, hashSync, compareSync } from 'bcryptjs';
import { RegisterDto } from 'src/auth/dto/create-user.dto';
import { IUser } from '../interface/users.interface';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PaginateInfo } from 'src/interface/paginate.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  getHashedPassword = (password: string) => {
    const salt = genSaltSync(10);
    const hashedPassword = hashSync(password, salt);
    return hashedPassword;
  };

  async create(createUserDto: CreateUserDto) {
    const hashedMyPassword = this.getHashedPassword(createUserDto.password);
    // Create a copy and remove password from it
    const userDataToCreate = { ...createUserDto };
    delete userDataToCreate.password;

    const res = await this.prisma.user.create({
      data: {
        ...userDataToCreate,
        password: hashedMyPassword,
      },
    });

    return {
      id: res.id,
      createdAt: res.username,
    };
  }

  async register(registerDto: RegisterDto) {
    const { password } = registerDto;
    // Create a copy to avoid modifying the original object
    const userDataToCreate = { ...registerDto };
    userDataToCreate.password = this.getHashedPassword(password);

    const user = await this.prisma.user.create({
      data: userDataToCreate,
    });

    // Create a new object without the password field
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll(info: PaginateInfo) {
    const { page, where, orderBy, skip, take, select, include } = info;

    // Count total with filters applied
    const totalItems = await this.prisma.user.count({ where });
    const totalPages = Math.ceil(totalItems / take);

    // Create query options object with only the properties Prisma accepts
    const queryOptions: any = {
      where,
      orderBy,
      skip,
      take,
    };

    // Add either select OR include based on which one is provided
    // Cannot use both simultaneously in Prisma
    if (select && Object.keys(select).length > 0) {
      // Ensure password is excluded from select
      queryOptions.select = {
        ...select,
        password: false,
      };
    } else if (include && Object.keys(include).length > 0) {
      queryOptions.include = {
        ...include,
        // Exclude password from include if it exists
        password: false,
      };
    } else {
      // If neither select nor include provided, explicitly exclude password
      queryOptions.select = { password: false };
    }

    // Execute query with correct options
    // @ts-ignore
    const users = await this.prisma.user.findWithDeleted(queryOptions);

    return {
      meta: {
        totalUsers: totalItems,
        userCount: users.length,
        usersPerPage: take,
        totalPages,
        currentPage: page,
      },
      result: users,
    };
  }

  async findOne(id: number) {
    const res = await this.prisma.user.findFirst({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        gender: true,
        age: true,
        created_time: true,
        updated_time: true,
        role: true,
      },
    });

    if (!res) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return res;
  }

  async findOneByEmail(email: string) {
    return await this.prisma.user.findFirst({
      where: {
        email: email,
      },
    });
  }

  isValidPasword(password: string, hash: string) {
    return compareSync(password, hash);
  }

  async update(id: number, user: IUser, updateUserDto: UpdateUserDto) {
    if (user.id !== id && user.role !== 'ADMIN') {
      throw new BadRequestException(
        'You cannot update information of another user',
      );
    }
    return await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        ...updateUserDto,
      },
    });
  }

  async remove(id: number) {
    // Find the user first to check if it's admin
    const foundUser = await this.prisma.user.findFirst({
      where: { id },
    });
    if (!foundUser) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    // @ts-ignore
    return await this.prisma.user.softDelete({
      where: {
        id,
      },
    });
  }

  async verifyPassword(password: string, user: IUser) {
    // Find the user by ID and get the hashed password
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });
    if (!dbUser) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    // Compare the provided password with the hashed password
    const isPasswordMatching = this.isValidPasword(password, dbUser.password);
    if (!isPasswordMatching) {
      throw new BadRequestException('Invalid password');
    }
    return { verified: true };
  }
}
