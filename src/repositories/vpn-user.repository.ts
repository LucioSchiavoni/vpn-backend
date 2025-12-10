import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { VpnUser, Prisma } from '@prisma/client';

@Injectable()
export class VpnUserRepository {
    constructor(private prisma: PrismaService) { }

    async findById(id: string): Promise<VpnUser | null> {
        return this.prisma.vpnUser.findUnique({
            where: { id },
            include: {
                connectionLogs: {
                    take: 10,
                    orderBy: { connectedAt: 'desc' },
                },
            },
        });
    }

    async findByAlternateEmail(email: string): Promise<VpnUser | null> {
        return this.prisma.vpnUser.findFirst({
            where: { alternativeEmail: email },
        });
    }

    async findInactive(daysSinceLastConnection: number): Promise<VpnUser[]> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastConnection);

        return this.prisma.vpnUser.findMany({
            where: {
                connectionLogs: {
                    every: {
                        connectedAt: { lt: cutoffDate },
                    },
                },
            },
        });
    }

    async create(data: Prisma.VpnUserCreateInput): Promise<VpnUser> {
        return this.prisma.vpnUser.create({ data });
    }

    async update(
        id: string,
        data: Prisma.VpnUserUpdateInput,
    ): Promise<VpnUser> {
        return this.prisma.vpnUser.update({
            where: { id },
            data,
        });
    }

    async delete(id: string): Promise<VpnUser> {
        return this.prisma.vpnUser.delete({ where: { id } });
    }
}