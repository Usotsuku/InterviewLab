import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CheckAuth } from '@core/decorators/check-auth.decorator';
import { CurrentUser, JwtPayload } from '@core/decorators/current-user.decorator';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

const AUTH_THROTTLE = {
  default: {
    limit: parseInt(process.env.AUTH_THROTTLE_LIMIT || '10', 10),
    ttl: parseInt(process.env.AUTH_THROTTLE_TTL_MS || '60000', 10),
  },
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly _authService: AuthService) {}

  @Post('register')
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account.' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully. Returns user profile and tokens.',
  })
  @ApiResponse({ status: 409, description: 'USER_ALREADY_EXISTS' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  async register(@Body() body: RegisterDto) {
    return this._authService.register(body);
  }

  @Post('login')
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and issue session tokens.' })
  @ApiResponse({ status: 200, description: 'Login successful. Returns user profile and tokens.' })
  @ApiResponse({ status: 401, description: 'INVALID_CREDENTIALS' })
  async login(@Body() body: LoginDto) {
    return this._authService.login(body);
  }

  @Post('refresh')
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new token pair.' })
  @ApiResponse({ status: 200, description: 'Tokens rotated successfully.' })
  @ApiResponse({ status: 401, description: 'INVALID_REFRESH_TOKEN or EXPIRED_REFRESH_TOKEN' })
  async refresh(@Body() body: RefreshTokenDto) {
    return this._authService.refresh(body);
  }

  @Post('logout')
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke the active session by invalidating the refresh token.' })
  @ApiResponse({ status: 200, description: 'Logged out successfully.' })
  async logout(@Body() body: RefreshTokenDto) {
    return this._authService.logout(body);
  }

  @Get('me')
  @CheckAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve the currently authenticated user profile.' })
  @ApiResponse({ status: 200, description: 'Returns the authenticated user profile.' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED_ACCESS' })
  async getMe(@CurrentUser() user: JwtPayload) {
    return this._authService.getMe(user.sub);
  }
}
