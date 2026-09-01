import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, Req, ParseFilePipeBuilder, HttpStatus } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Roles(Role.ADMIN, Role.TEACHER)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createMaterialDto: CreateMaterialDto, 
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024, message: 'File is too large. Maximum size is 10MB.' })
        .build({ errorHttpStatusCode: HttpStatus.PAYLOAD_TOO_LARGE })
  ) file: Express.Multer.File,
    @Req() req: Request & { user: { id: string; role: Role } },
  ) {
    return this.materialsService.create(createMaterialDto, file, req.user.id, req.user.role);
  }

  // Admin gets all, others get materials filtered by their role and "all"
  @Get()
  findAll(@Req() req: Request & { user: { id: string; role: Role } }) {
    return this.materialsService.findAll(req.user.id, req.user.role);
  }

  // Get admin materials (for teachers to view admin-published content)
  @Roles(Role.TEACHER, Role.STUDENT)
  @Get('admin/published')
  getAdminMaterials(@Req() req: Request & { user: { id: string; role: Role } }) {
    return this.materialsService.getAdminMaterials(req.user.id, req.user.role);
  }

  @Roles(Role.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id') id: string, 
    @Body() updateMaterialDto: UpdateMaterialDto, 
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024, message: 'File is too large. Maximum size is 10MB.' })
        .build({ errorHttpStatusCode: HttpStatus.PAYLOAD_TOO_LARGE, fileIsRequired: false })
    ) file?: Express.Multer.File
  ) {
    return this.materialsService.update(id, updateMaterialDto, file);
  }

  @Roles(Role.ADMIN, Role.STUDENT, Role.TEACHER, Role.PARENT)
  @Get(':id/download')
  download(@Param('id') id: string, @Req() req: Request & { user: { id: string; role: Role } }) {
    return this.materialsService.getDownloadUrl(id, req.user.id, req.user.role);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.materialsService.remove(id);
  }
}
