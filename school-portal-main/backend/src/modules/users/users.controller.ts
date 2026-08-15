import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

type AuthRequest = Request & { user: { id: string; role: Role } };

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /users/stats — dashboard statistics */
  @Get('stats')
  getStats() {
    return this.usersService.getStats();
  }

  /** GET /users/class-sections — for dropdowns */
  @Get('class-sections')
  getClassSections() {
    return this.usersService.getClassSections();
  }

  /** GET /users — paginated list with search/filter/sort */
  @Get()
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query, '');
  }

  /** GET /users/:id — single user */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /** POST /users — create user + profile record */
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /** PATCH /users/:id — update user + profile */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: AuthRequest,
  ) {
    return this.usersService.update(id, dto, req.user.id);
  }

  /** PATCH /users/:id/activate */
  @Patch(':id/activate')
  activate(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.usersService.setActive(id, true, req.user.id);
  }

  /** PATCH /users/:id/deactivate */
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.usersService.setActive(id, false, req.user.id);
  }

  /** POST /users/:id/reset-password */
  @Post(':id/reset-password')
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.usersService.resetPassword(id, dto);
  }

  /** DELETE /users/:id — soft delete */
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.usersService.remove(id, req.user.id);
  }
}
