import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConnectionLog, Prisma } from '@prisma/client';

@Injectable()
export class ConnectionLogRepository {
    constructor(private prisma: PrismaService) { }

    async createBatch(logs: Prisma.ConnectionLogCreateManyInput[]) {
        return this.prisma.connectionLog.createMany({
            data: logs,
            skipDuplicates: true,
        });
    }

    async findByUserId(userId: string, limit: number = 50) {
        return this.prisma.connectionLog.findMany({
            where: { vpnUserId: userId },
            orderBy: { connectedAt: 'desc' },
            take: limit,
        });
    }

    async findCountryChanges(userId: string) {
        return this.prisma.$queryRaw<any[]>`
      SELECT 
        cl1.country as previous_country,
        cl2.country as current_country,
        cl2.connectedAt as change_date
      FROM connection_logs cl1
      JOIN connection_logs cl2 ON cl2.vpnUserId = cl1.vpnUserId
      WHERE cl1.vpnUserId = ${userId}
        AND cl2.connectedAt > cl1.connectedAt
        AND cl1.country != cl2.country
      ORDER BY cl2.connectedAt DESC
      LIMIT 10
    `;
    }
}