import { Module } from '@nestjs/common';
import { VpnUserRepository } from './vpn-user.repository';
import { ConnectionLogRepository } from './connection-log.repository';

@Module({
    providers: [
        VpnUserRepository,
        ConnectionLogRepository,
    ],
    exports: [
        VpnUserRepository,
        ConnectionLogRepository,
    ],
})
export class RepositoriesModule { }