
import { IsNotEmpty, IsString, Validate } from 'class-validator';
import { IsStrongPassword } from '../../auth/validators/password.validator';

export class ChangePasswordDto {
    @IsString({ message: 'La contraseña debe ser texto' })
    @Validate(IsStrongPassword)
    @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
    newPassword: string;
}
