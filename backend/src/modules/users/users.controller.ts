import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { LinkChildrenDto } from './dto/link-children.dto';
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
  getClassSections(@Query('academicYearId') academicYearId?: string) {
    return this.usersService.getClassSections(academicYearId);
  }

  /** GET /users/parents-list — for parent lookup dropdown */
  @Get('parents-list')
  getParentsList() {
    return this.usersService.getParentsList();
  }

  /** GET /users/students-lookup — for parent-child linking lookup */
  @Get('students-lookup')
  getStudentsLookup() {
    return this.usersService.getStudentsLookup();
  }

  /** GET /users/parents/:parentId/children — get linked children for a parent */
  @Get('parents/:parentId/children')
  getParentChildren(@Param('parentId') parentId: string) {
    return this.usersService.getParentChildren(parentId);
  }

  /** PUT /users/parents/:parentId/children — link/unlink children for a parent */
  @Put('parents/:parentId/children')
  linkParentChildren(
    @Param('parentId') parentId: string,
    @Body() dto: LinkChildrenDto,
  ) {
    return this.usersService.linkParentChildren(parentId, dto);
  }

  /** GET /users/export — export users as CSV */
  @Get('export')
  async exportUsers(
    @Query() query: QueryUsersDto,
    @Res() res: Response,
  ) {
    const { csv, filename } = await this.usersService.exportUsers(query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csv);
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
