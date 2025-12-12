
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class LoginAttemptService {
    private readonly logger = new Logger(LoginAttemptService.name);

    constructor(private prisma: PrismaService) { }

    async createLoginAttempt(
        email: string,
        ipAddress: string,
        userAgent: string | undefined,
        success: boolean,
        userId?: string,
        failureReason?: string,
    ) {
        try {
            await this.prisma.loginAttempt.create({
                data: {
                    email,
                    ipAddress,
                    userAgent,
                    success,
                    userId,
                    failureReason,
                },
            });
        } catch (error) {
            // We just log the error, we don't want to block the login process if audit fails
            this.logger.error('Failed to create login attempt record', error);
        }
    }
}
