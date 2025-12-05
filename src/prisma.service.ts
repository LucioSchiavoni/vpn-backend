import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { createPool } from 'mariadb';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        // Create MariaDB connection pool
        const pool = createPool(process.env.DATABASE_URL!);

        // Create Prisma MariaDB adapter
        const adapter = new PrismaMariaDb(pool);

        // Initialize PrismaClient with the adapter
        super({
            adapter,
        });
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
