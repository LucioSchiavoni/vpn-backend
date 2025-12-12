
import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto';
import { LoginAttemptService } from './login-attempt.service';
import { v4 as uuidv4 } from 'uuid';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

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
    session: {
        id: string;
        expiresAt: Date;
    };
}

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private loginAttemptService: LoginAttemptService,
    ) { }

    async login(
        loginDto: LoginDto,
        ipAddress: string,
        userAgent: string,
    ): Promise<AuthResponse> {
        const user = await this.prisma.systemUser.findUnique({
            where: { email: loginDto.email },
        });

        if (!user) {
            await this.loginAttemptService.createLoginAttempt(
                loginDto.email,
                ipAddress,
                userAgent,
                false,
                undefined,
                'User not found',
            );
            throw new UnauthorizedException('Credenciales inválidas');
        }

        if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
            await this.loginAttemptService.createLoginAttempt(
                loginDto.email,
                ipAddress,
                userAgent,
                false,
                user.id,
                'Account locked',
            );
            throw new UnauthorizedException(
                `Cuenta bloqueada temporalmente. Intente nuevamente en ${this.getMinutesUntilUnlock(user.lockedUntil)} minutos.`,
            );
        }

        // Automatic unlock if time passed
        if (user.isLocked && user.lockedUntil && user.lockedUntil <= new Date()) {
            await this.prisma.systemUser.update({
                where: { id: user.id },
                data: { isLocked: false, lockedUntil: null, failedLoginAttempts: 0 },
            });
        }

        if (!user.isActive) {
            await this.loginAttemptService.createLoginAttempt(
                loginDto.email,
                ipAddress,
                userAgent,
                false,
                user.id,
                'User inactive',
            );
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const isPasswordValid = await bcrypt.compare(
            loginDto.password,
            user.password,
        );

        if (!isPasswordValid) {
            await this.handleFailedLogin(user, ipAddress, userAgent);
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Reset failed attempts on success
        await this.prisma.systemUser.update({
            where: { id: user.id },
            data: {
                lastLogin: new Date(),
                failedLoginAttempts: 0,
                isLocked: false,
                lockedUntil: null,
            },
        });

        const sessionId = uuidv4();
        const tokens = await this.generateTokens(user.id, user.email, user.role, sessionId);

        // Create Session
        const session = await this.createSession(
            user.id,
            tokens.refreshToken,
            ipAddress,
            userAgent,
            sessionId,
        );

        await this.loginAttemptService.createLoginAttempt(
            loginDto.email,
            ipAddress,
            userAgent,
            true,
            user.id,
        );

        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
            session: {
                id: session.id,
                expiresAt: session.expiresAt,
            }
        };
    }

    private async handleFailedLogin(user: any, ip: string, ua: string) {
        const attempts = user.failedLoginAttempts + 1;
        let updateData: any = {
            failedLoginAttempts: attempts,
            lastFailedAttempt: new Date(),
        };

        if (attempts >= MAX_FAILED_ATTEMPTS) {
            const lockedUntil = new Date();
            lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
            updateData = {
                ...updateData,
                isLocked: true,
                lockedUntil,
            };
        }

        await this.prisma.systemUser.update({
            where: { id: user.id },
            data: updateData,
        });

        await this.loginAttemptService.createLoginAttempt(
            user.email,
            ip,
            ua,
            false,
            user.id,
            `Invalid password (Attempt ${attempts})`
        );
    }

    private getMinutesUntilUnlock(lockedUntil: Date): number {
        const now = new Date();
        const diffMs = lockedUntil.getTime() - now.getTime();
        return Math.ceil(diffMs / 60000);
    }

    async refresh(refreshToken: string, ipAddress: string, userAgent: string): Promise<AuthTokens> {
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

        const userId = payload.sub;

        // Find system user
        const user = await this.prisma.systemUser.findUnique({
            where: { id: userId },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException('Usuario inválido o inactivo');
        }

        const sessions = await this.prisma.session.findMany({
            where: {
                userId,
                isRevoked: false,
                expiresAt: { gt: new Date() }
            }
        });

        let validSession: any = null;
        for (const session of sessions) {
            const isMatch = await bcrypt.compare(refreshToken, session.refreshToken);
            if (isMatch) {
                validSession = session;
                break;
            }
        }

        if (!validSession) {
            throw new UnauthorizedException('Sesión inválida o expirada');
        }

        // Rotate tokens
        const tokens = await this.generateTokens(user.id, user.email, user.role, validSession.id);
        const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, BCRYPT_ROUNDS);

        await this.prisma.session.update({
            where: { id: validSession.id },
            data: {
                refreshToken: hashedRefreshToken,
                lastActivityAt: new Date(),
                ipAddress,
                userAgent,
            }
        });

        return tokens;
    }

    async createSession(userId: string, refreshToken: string, ipAddress: string, userAgent: string, sessionId?: string) {
        const hashedRefreshToken = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        return this.prisma.session.create({
            data: {
                id: sessionId,
                userId,
                refreshToken: hashedRefreshToken,
                ipAddress,
                userAgent,
                expiresAt,
            }
        });
    }

    async logout(userId: string, sessionId?: string): Promise<void> {
        if (sessionId) {
            await this.prisma.session.update({
                where: { id: sessionId },
                data: { isRevoked: true },
            }).catch(() => {
                // Ignore if session not found or already revoked/deleted
            });
        }
    }

    async logoutSession(userId: string, sessionId: string) {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId }
        });

        if (!session || session.userId !== userId) {
            throw new UnauthorizedException('Sesión no encontrada o no pertenece al usuario');
        }

        await this.prisma.session.update({
            where: { id: sessionId },
            data: { isRevoked: true }
        });
    }

    async logoutAll(userId: string): Promise<void> {
        await this.prisma.session.updateMany({
            where: {
                userId,
                isRevoked: false
            },
            data: { isRevoked: true },
        });
    }

    async getMySessions(userId: string) {
        return this.prisma.session.findMany({
            where: {
                userId,
                isRevoked: false,
                expiresAt: { gt: new Date() }
            },
            select: {
                id: true,
                ipAddress: true,
                userAgent: true,
                createdAt: true,
                lastActivityAt: true,
                deviceFingerprint: true
            },
            orderBy: { lastActivityAt: 'desc' }
        });
    }

    async cleanupExpiredSessions() {
        await this.prisma.session.deleteMany({
            where: {
                expiresAt: { lt: new Date() }
            }
        });
    }

    private async generateTokens(
        userId: string,
        email: string,
        role: string,
        sessionId?: string,
    ): Promise<AuthTokens> {
        const payload = { sub: userId, email, role, sessionId };

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

    // Kept for backward compatibility if other services use it, but hashing now happens in createSession/update
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, BCRYPT_ROUNDS);
    }
}
