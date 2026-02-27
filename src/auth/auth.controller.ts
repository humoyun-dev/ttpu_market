import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { randomBytes } from 'crypto';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthMeDto, AuthSessionDto, CsrfTokenDto, LoginDto, LogoutDto, RegisterDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private static accessTokenCookieOptions() {
    const secure = process.env.COOKIE_SECURE === 'true';
    return {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  private static csrfCookieOptions() {
    const secure = process.env.COOKIE_SECURE === 'true';
    return {
      httpOnly: false,
      secure,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ description: 'User registered successfully', type: AuthSessionDto })
  @ApiConflictResponse({ description: 'Email already registered' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    res.cookie('access_token', result.accessToken, AuthController.accessTokenCookieOptions());
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ description: 'Login successful', type: AuthSessionDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    res.cookie('access_token', result.accessToken, AuthController.accessTokenCookieOptions());
    return result;
  }

  @Get('csrf')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get CSRF token (double-submit cookie)' })
  @ApiOkResponse({ description: 'CSRF token', type: CsrfTokenDto })
  async getCsrf(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const existing = req.cookies?.csrf_token;
    const csrfToken = typeof existing === 'string' && existing.length > 0 ? existing : randomBytes(32).toString('hex');
    res.cookie('csrf_token', csrfToken, AuthController.csrfCookieOptions());
    return { csrfToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout (clear auth cookies)' })
  @ApiOkResponse({ description: 'Logged out', type: LogoutDto })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', AuthController.accessTokenCookieOptions());
    res.clearCookie('csrf_token', AuthController.csrfCookieOptions());
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'User profile', type: AuthMeDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getMe(BigInt(user.id));
  }
}
