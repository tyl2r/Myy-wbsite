import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundError } from '../../common/errors/domain.error';

const PUBLIC_SELECT = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  status: true,
  ratingAvg: true,
  ratingCount: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PUBLIC_SELECT,
    });
    if (!user) throw new NotFoundError('User not found');
    return { data: user };
  }

  async updateProfile(
    userId: bigint,
    patch: { fullName?: string; phone?: string | null },
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: patch,
      select: PUBLIC_SELECT,
    });
    return { data: user };
  }
}
