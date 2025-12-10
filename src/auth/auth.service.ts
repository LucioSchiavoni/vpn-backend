import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto';

const BCRYPT_ROUNDS = 12;

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
    };
}

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async login(loginDto: LoginDto): Promise<AuthResponse> {
        const user = await this.prisma.systemUser.findUnique({
            where: { email: loginDto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const isPasswordValid = await bcrypt.compare(
            loginDto.password,
            user.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        // Actualizar lastLogin
        await this.prisma.systemUser.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
        };
    }

    async refresh(refreshToken: string): Promise<AuthTokens> {
        if (!refreshToken) {
            throw new BadRequestException('Refresh token requerido');
        }

        let payload: any;
        try {
            payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });
        } catch (error) {
            throw new UnauthorizedException('Refresh token inválido o expirado');
        }

        const user = await this.prisma.systemUser.findUnique({
            where: { id: payload.sub },
        });

        if (!user || !user.refreshToken) {
            throw new UnauthorizedException('Refresh token inválido');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Usuario inactivo');
        }

        const refreshTokenMatches = await bcrypt.compare(
            refreshToken,
            user.refreshToken,
        );

        if (!refreshTokenMatches) {
            throw new UnauthorizedException('Refresh token inválido');
        }

        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        return tokens;
    }

    async logout(userId: string): Promise<void> {
        await this.prisma.systemUser.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
    }

    private async generateTokens(
        userId: string,
        email: string,
        role: string,
    ): Promise<AuthTokens> {
        const payload = { sub: userId, email, role };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_SECRET'),
                expiresIn: '15m',
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: '7d',
            }),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }

    private async updateRefreshToken(
        userId: string,
        refreshToken: string,
    ): Promise<void> {
        const hashedRefreshToken = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
        await this.prisma.systemUser.update({
            where: { id: userId },
            data: { refreshToken: hashedRefreshToken },
        });
    }

    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, BCRYPT_ROUNDS);
    }
}
