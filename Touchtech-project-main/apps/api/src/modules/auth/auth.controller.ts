import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UsePipes,
  HttpCode,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  RegisterDto,
  LoginDto,
  RefreshDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

const REFRESH_COOKIE = 'refresh_token';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 14, // 14 days in seconds
};

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private meta(req: any) {
    return { userAgent: req.headers?.['user-agent'], ip: req.ip };
  }

  private setRefreshCookie(res: any, token: string) {
    res.setCookie(REFRESH_COOKIE, token, COOKIE_OPTS);
  }

  private clearRefreshCookie(res: any) {
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
  }

  @Public()
  @Post('register')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() dto: RegisterDto, @Req() req: any, @Res({ passthrough: true }) res: any) {
    const pair = await this.auth.register(dto, this.meta(req));
    this.setRefreshCookie(res, pair.refreshToken);
    return { accessToken: pair.accessToken };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() dto: LoginDto, @Req() req: any, @Res({ passthrough: true }) res: any) {
    const pair = await this.auth.login(dto, this.meta(req));
    this.setRefreshCookie(res, pair.refreshToken);
    return { accessToken: pair.accessToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: any) {
    // Read from httpOnly cookie; fall back to body for non-browser clients.
    const raw: string =
      req.cookies?.[REFRESH_COOKIE] ??
      (req.body as RefreshDto | undefined)?.refreshToken;
    const pair = await this.auth.refresh(raw, this.meta(req));
    this.setRefreshCookie(res, pair.refreshToken);
    return { accessToken: pair.accessToken };
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const raw: string =
      req.cookies?.[REFRESH_COOKIE] ??
      (req.body as RefreshDto | undefined)?.refreshToken;
    if (raw) await this.auth.logout(raw);
    this.clearRefreshCookie(res);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    // Always returns 200 to prevent email enumeration.
    return this.auth.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }
}
