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

        this.$on('query', (e: any) => {
            if (e.duration > 1000) {
                this.logger.warn(
                    `Slow query detected: ${e.duration}ms - ${e.query.substring(0, 100)}`,
                );
            }
        });

        this.$on('error', (e: any) => {
            this.logger.error(`Database error: ${e.message}`);
        });
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