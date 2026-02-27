import { ApiProperty } from '@nestjs/swagger';
import { StoreStatus, UserRole } from '@prisma/client';

export class AuthUserDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;
}

export class AuthSessionDto {
  @ApiProperty({
    description:
      'JWT access token. Also set as HttpOnly cookie "access_token" for browser clients.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}

export class AuthStoreSummaryDto {
  @ApiProperty({ example: '10' })
  id: string;

  @ApiProperty({ example: 'My Store' })
  name: string;

  @ApiProperty({ example: 'my-store' })
  slug: string;

  @ApiProperty({ enum: StoreStatus })
  status: StoreStatus;
}

export class AuthMeDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: [String] })
  permissions: string[];

  @ApiProperty({ type: [AuthStoreSummaryDto] })
  stores: AuthStoreSummaryDto[];
}

export class CsrfTokenDto {
  @ApiProperty({
    description:
      'CSRF token that must be echoed in the "x-csrf-token" header for cookie-authenticated unsafe requests.',
    example: '2f6d0b3d0d3f6f4c...',
  })
  csrfToken: string;
}

export class LogoutDto {
  @ApiProperty({ example: true })
  ok: boolean;
}

