
import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateSystemUserDto, UpdateSystemUserDto, ChangePasswordDto } from './dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class SystemUsersService {
    constructor(private prisma: PrismaService) { }

    // Helper to exclude sensitive fields
    private exclude<User, Key extends keyof User>(
        user: User,
        keys: Key[],
    ): Omit<User, Key> {
        return Object.fromEntries(
            Object.entries(user as any).filter(([key]) => !keys.includes(key as Key)),
        ) as Omit<User, Key>;
    }

    async create(createSystemUserDto: CreateSystemUserDto) {
        const existingUser = await this.prisma.systemUser.findUnique({
            where: { email: createSystemUserDto.email },
        });

        if (existingUser) {
            throw new ConflictException('El email ya está registrado');
        }

        const hashedPassword = await bcrypt.hash(createSystemUserDto.password, 12);

        const user = await this.prisma.systemUser.create({
            data: {
                ...createSystemUserDto,
                password: hashedPassword,
                isActive: true,
            },
        });

        return this.exclude(user, ['password']);
    }

    async findAll() {
        const users = await this.prisma.systemUser.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return users.map((user) => this.exclude(user, ['password']));
    }

    async findOne(id: string) {
        const user = await this.prisma.systemUser.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        return this.exclude(user, ['password']);
    }

    async update(id: string, updateSystemUserDto: UpdateSystemUserDto) {
        const user = await this.prisma.systemUser.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        if (updateSystemUserDto.email && updateSystemUserDto.email !== user.email) {
            const existingEmail = await this.prisma.systemUser.findUnique({
                where: { email: updateSystemUserDto.email },
            });
            if (existingEmail) {
                throw new ConflictException('El email ya está en uso por otro usuario');
            }
        }


        const { password, ...data } = updateSystemUserDto as any;

        const updatedUser = await this.prisma.systemUser.update({
            where: { id },
            data: data,
        });

        return this.exclude(updatedUser, ['password']);
    }

    async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
        const user = await this.prisma.systemUser.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 12);

        await this.prisma.systemUser.update({
            where: { id },
            data: { password: hashedPassword },
        });

        return { message: 'Contraseña actualizada correctamente' };
    }

    async remove(id: string) {
        const user = await this.prisma.systemUser.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const updatedUser = await this.prisma.systemUser.update({
            where: { id },
            data: { isActive: false },
        });

        return this.exclude(updatedUser, ['password']);
    }
}
