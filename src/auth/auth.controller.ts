
import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Param,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto';
import { JwtAuthGuard } from './guards';
import { CurrentUser, IpAddress, UserAgent } from './decorators';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
    async login(
        @Body() loginDto: LoginDto,
        @IpAddress() ipAddress: string,
        @UserAgent() userAgent: string,
    ) {
        return this.authService.login(loginDto, ipAddress, userAgent);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Body() refreshTokenDto: RefreshTokenDto,
        @IpAddress() ipAddress: string,
        @UserAgent() userAgent: string,
    ) {
        return this.authService.refresh(
            refreshTokenDto.refreshToken,
            ipAddress,
            userAgent,
        );
    }

    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    async logout(
        @CurrentUser('userId') userId: string,
        @CurrentUser('sessionId') sessionId: string,
    ) {
        return this.authService.logout(userId, sessionId);
    }

    @Post('logout-all')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    async logoutAll(@CurrentUser('userId') userId: string) {
        return this.authService.logoutAll(userId);
    }

    @Get('sessions')
    @UseGuards(JwtAuthGuard)
    async getSessions(@CurrentUser('userId') userId: string) {
        return this.authService.getMySessions(userId);
    }

    @Delete('sessions/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    async revokeSession(
        @CurrentUser('userId') userId: string,
        @Param('id') sessionId: string,
    ) {
        return this.authService.logoutSession(userId, sessionId);
    }
}
