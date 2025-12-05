import {
    Injectable,
    OnModuleInit,
    OnModuleDestroy
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    constructor(configService: ConfigService) {
        const databaseUrl = configService.getOrThrow<string>('DATABASE_URL');

        const adapter = new PrismaMariaDb(databaseUrl);

        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}