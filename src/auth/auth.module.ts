import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginAttemptService } from './login-attempt.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [
        DatabaseModule,
        PassportModule,
        JwtModule.register({}),
        ConfigModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, LoginAttemptService],
    exports: [AuthService, LoginAttemptService],
})
export class AuthModule { }
