<<<<<<< HEAD
import { Injectable, NotFoundException } from '@nestjs/common';
=======
import { Injectable } from '@nestjs/common';
>>>>>>> e52a24ea29f3dbed57cfdb5f60aa5e20f9d2173b
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
<<<<<<< HEAD
    return this.prisma.user.findMany({
      select: {
        id: true,
        loginId: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        loginId: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }
}
=======
    return await this.prisma.user.findMany();
  }
}
>>>>>>> e52a24ea29f3dbed57cfdb5f60aa5e20f9d2173b
