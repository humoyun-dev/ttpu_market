import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { StoreStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { ApiUserRole, RegisterDto, LoginDto } from './dto';

type StoreSummary = {
  id: string;
  name: string;
  slug: string;
  status: StoreStatus;
};

const PERMISSIONS_BY_ROLE: Record<UserRole, string[]> = {
  ADMIN: [
    'sellers:read',
    'sellers:update',
    'stores:read',
    'stores:update',
    'orders:read',
    'metrics:read',
  ],
  MERCHANT: [
    'products:read',
    'products:write',
    'orders:read',
    'orders:update_status',
    'settings:telegram',
    'settings:payments',
  ],
};

function toApiUserRole(role: UserRole): ApiUserRole {
  return role === UserRole.ADMIN ? ApiUserRole.ADMIN : ApiUserRole.SELLER;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        fullName: dto.fullName,
      },
    });

    const accessToken = this.generateToken(user.id, user.email);

    return {
      accessToken,
      user: {
        id: user.id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: toApiUserRole(user.role),
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const accessToken = this.generateToken(user.id, user.email);

    return {
      accessToken,
      user: {
        id: user.id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: toApiUserRole(user.role),
      },
    };
  }

  async getMe(userId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const permissions = PERMISSIONS_BY_ROLE[user.role] ?? [];
    const stores =
      user.role === UserRole.MERCHANT ? await this.listAccessibleStores(userId) : [];

    return {
      id: user.id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: toApiUserRole(user.role),
      isActive: user.isActive,
      createdAt: user.createdAt,
      permissions,
      stores,
    };
  }

  async validateUser(userId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid user');
    }

    return user;
  }

  private async listAccessibleStores(userId: bigint): Promise<StoreSummary[]> {
    const [owned, staffLinks] = await Promise.all([
      this.prisma.store.findMany({
        where: { ownerId: userId },
        select: { id: true, name: true, slug: true, status: true },
      }),
      this.prisma.storeStaff.findMany({
        where: { userId },
        select: {
          store: { select: { id: true, name: true, slug: true, status: true } },
        },
      }),
    ]);

    const storesById = new Map<string, StoreSummary>();
    for (const store of owned) {
      storesById.set(store.id.toString(), {
        id: store.id.toString(),
        name: store.name,
        slug: store.slug,
        status: store.status,
      });
    }
    for (const link of staffLinks) {
      const store = link.store;
      storesById.set(store.id.toString(), {
        id: store.id.toString(),
        name: store.name,
        slug: store.slug,
        status: store.status,
      });
    }

    return Array.from(storesById.values());
  }

  private generateToken(userId: bigint, email: string): string {
    const payload = { sub: userId.toString(), email };
    return this.jwtService.sign(payload);
  }
}
