
import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPassword implements ValidatorConstraintInterface {
    validate(password: string, args: ValidationArguments) {
        if (!password) return false;

        // At least 8 characters
        if (password.length < 8) return false;

        // At least one uppercase letter
        if (!/[A-Z]/.test(password)) return false;

        // At least one lowercase letter
        if (!/[a-z]/.test(password)) return false;

        // At least one number
        if (!/\d/.test(password)) return false;

        // At least one special character
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;

        return true;
    }

    defaultMessage(args: ValidationArguments) {
        return 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial';
    }
}
