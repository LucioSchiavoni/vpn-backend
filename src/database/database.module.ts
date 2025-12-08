import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { DatabaseConfigService } from './config/database-config.service';
import { DatabaseHealthIndicator } from './health/database-health.indicator';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        DatabaseConfigService,
        PrismaService,
        DatabaseHealthIndicator,
    ],
    exports: [PrismaService, DatabaseHealthIndicator],
})
export class DatabaseModule { }