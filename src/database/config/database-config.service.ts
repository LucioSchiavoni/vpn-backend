import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from './database-config.interface';

@Injectable()
export class DatabaseConfigService {
    constructor(private configService: ConfigService) { }

    get config(): DatabaseConfig {
        return {
            url: this.configService.getOrThrow<string>('DATABASE_URL'),
            connectionLimit: this.configService.get('DB_CONNECTION_LIMIT', 10),
            poolTimeout: this.configService.get('DB_POOL_TIMEOUT', 20),
            enableLogging: this.configService.get('DB_ENABLE_LOGGING', false),
        };
    }

    get isProduction(): boolean {
        return this.configService.get('NODE_ENV') === 'production';
    }
}