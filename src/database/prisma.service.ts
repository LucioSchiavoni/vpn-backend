import {
    Injectable,
    OnModuleInit,
    OnModuleDestroy,
    Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { DatabaseConfigService } from './config/database-config.service';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor(private databaseConfig: DatabaseConfigService) {
        const config = databaseConfig.config;
        const adapter = new PrismaMariaDb(config.url);

        super({
            adapter,
            log: config.enableLogging
                ? [
                    { emit: 'event', level: 'query' },
                    { emit: 'event', level: 'error' },
                    { emit: 'event', level: 'warn' },
                ]
                : ['error'],
        });

        this.setupLogging(config.enableLogging);
    }

    private setupLogging(enableLogging: boolean) {
        if (!enableLogging) return;


        this.logger.log('Prisma logging enabled via configuration');
    }

    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('Database connection established');
        } catch (error) {
            this.logger.error('Failed to connect to database', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('Database connection closed');
    }

    async enableShutdownHooks(app: any) {
        process.on('beforeExit', async () => {
            await app.close();
        });
    }
}