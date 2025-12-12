
import { PartialType } from '@nestjs/mapped-types';
import { CreateSystemUserDto } from './create-system-user.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateSystemUserDto extends PartialType(CreateSystemUserDto) {
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
