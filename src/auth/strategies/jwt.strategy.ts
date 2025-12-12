import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../database/prisma.service';

export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    sessionId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET'),
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.prisma.systemUser.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Usuario inactivo');
        }

        return {
            userId: user.id,
            email: user.email,
            role: user.role,
            sessionId: payload.sessionId,
        };
    }
}
