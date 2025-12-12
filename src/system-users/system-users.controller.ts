
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import { SystemUsersService } from './system-users.service';
import { CreateSystemUserDto, UpdateSystemUserDto, ChangePasswordDto } from './dto';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('system-users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SystemUsersController {
    constructor(private readonly systemUsersService: SystemUsersService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() createSystemUserDto: CreateSystemUserDto) {
        return this.systemUsersService.create(createSystemUserDto);
    }

    @Get()
    findAll() {
        return this.systemUsersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.systemUsersService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateSystemUserDto: UpdateSystemUserDto,
    ) {
        return this.systemUsersService.update(id, updateSystemUserDto);
    }

    @Patch(':id/password')
    changePassword(
        @Param('id') id: string,
        @Body() changePasswordDto: ChangePasswordDto,
    ) {
        return this.systemUsersService.changePassword(id, changePasswordDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    remove(@Param('id') id: string) {
        return this.systemUsersService.remove(id);
    }
}
