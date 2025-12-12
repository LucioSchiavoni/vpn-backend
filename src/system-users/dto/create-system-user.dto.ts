
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength, Validate } from 'class-validator';
import { UserRole } from '@prisma/client';
import { IsStrongPassword } from '../../auth/validators/password.validator';

export class CreateSystemUserDto {
    @IsEmail({}, { message: 'El email debe ser válido' })
    @IsNotEmpty({ message: 'El email es requerido' })
    email: string;

    @IsString({ message: 'La contraseña debe ser texto' })
    @Validate(IsStrongPassword)
    @IsNotEmpty({ message: 'La contraseña es requerida' })
    password: string;

    @IsString({ message: 'El nombre debe ser texto' })
    @IsNotEmpty({ message: 'El nombre es requerido' })
    firstName: string;

    @IsString({ message: 'El apellido debe ser texto' })
    @IsNotEmpty({ message: 'El apellido es requerido' })
    lastName: string;

    @IsEnum(UserRole, { message: 'Rol inválido' })
    @IsNotEmpty({ message: 'El rol es requerido' })
    role: UserRole;
}
