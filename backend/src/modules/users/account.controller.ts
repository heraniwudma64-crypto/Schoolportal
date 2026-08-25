import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';

type AuthRequest = Request & { user: { id: string; role: Role } };

@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@Req() req: AuthRequest) {
    return this.usersService.getAccount(req.user.id);
  }

  @Patch('me')
  updateProfile(@Req() req: AuthRequest, @Body() data: { name?: string; loginId?: string; email?: string }) {
    return this.usersService.updateAccount(req.user.id, data);
  }

  @Patch('me/password')
  updatePassword(@Req() req: AuthRequest, @Body() data: { currentPassword?: string; newPassword?: string }) {
    return this.usersService.updatePassword(req.user.id, data);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @Req() req: AuthRequest,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024, message: 'File is too large. Maximum size is 5MB.' })
        .build({ errorHttpStatusCode: HttpStatus.PAYLOAD_TOO_LARGE })
    ) file: Express.Multer.File
  ) {
    return this.usersService.uploadAvatar(req.user.id, file);
  }

  @Delete('me/avatar')
  removeAvatar(@Req() req: AuthRequest) {
    return this.usersService.removeAvatar(req.user.id);
  }
}
