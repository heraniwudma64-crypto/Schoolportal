import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaClient, Role } from '@prisma/client';
import { CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

@Injectable()
export class MaterialsService {
  private supabaseUrl = process.env.DIRECT_URL ? process.env.DIRECT_URL.replace('postgres://', 'https://').split(':')[0] : '';
  // Since we don't have the service role key natively in env right now, we will try to use the project ref from the DB URL.
  // Actually, without the service key, we cannot upload. Let's ask the user to provide SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY.
  // For the sake of this code, we assume SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY will be added.
  private supabase = createClient(
    process.env.SUPABASE_URL || this.extractSupabaseUrl(),
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'fake-key-for-now',
    { auth: { persistSession: false } }
  );

  private extractSupabaseUrl() {
    const dbUrl = process.env.DATABASE_URL || '';
    const match = dbUrl.match(/@(.*?)\.pooler/);
    if (match) {
      const parts = match[1].split('-');
      const ref = parts.length > 2 ? parts[0] : match[1]; // aws-0-eu-west-1.pooler.supabase.com doesn't easily give ref
      // Quick fix for the specific host: aws-0-eu-west-1.pooler.supabase.com
      // The user database URL is: postgresql://postgres.jdwpgbubenazrdqohgrq:***@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
      const userMatch = dbUrl.match(/postgres\.(.*?):/);
      if (userMatch) {
        return `https://${userMatch[1]}.supabase.co`;
      }
    }
    return '';
  }

  async findAll(role?: Role) {
    const where: any = {};
    if (role && role !== Role.ADMIN) {
      where.OR = [
        { targetRole: 'all' },
        { targetRole: role.toLowerCase() }
      ];
    }
    return prisma.material.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const material = await prisma.material.findUnique({ where: { id } });
    if (!material) throw new NotFoundException('Material not found');
    return material;
  }

  async create(createMaterialDto: CreateMaterialDto, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '').toLowerCase();
    const fileName = `${crypto.randomUUID()}-${sanitizedName}`;

    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from('materials')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError);
      if (uploadError.message?.includes('Invalid Compact JWS') || uploadError.message?.includes('API key')) {
        throw new InternalServerErrorException('Supabase Service Role Key is missing or invalid. Please configure SUPABASE_SERVICE_ROLE_KEY in .env');
      }
      throw new InternalServerErrorException(`Storage Error: ${uploadError.message || 'Failed to upload file'}`);
    }

    const { data: publicUrlData } = this.supabase.storage
      .from('materials')
      .getPublicUrl(fileName);

    return prisma.material.create({
      data: {
        title: createMaterialDto.title,
        description: createMaterialDto.description,
        category: createMaterialDto.category || 'material',
        targetRole: createMaterialDto.targetRole || 'all',
        fileType: file.originalname.split('.').pop() || null,
        fileUrl: publicUrlData.publicUrl,
      },
    });
  }

  async update(id: string, updateMaterialDto: UpdateMaterialDto, file?: Express.Multer.File) {
    const material = await this.findOne(id);
    let fileUrl = material.fileUrl;
    let fileType = material.fileType;

    if (file) {
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '').toLowerCase();
      const fileName = `${crypto.randomUUID()}-${sanitizedName}`;

      const { error: uploadError } = await this.supabase.storage
        .from('materials')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('Storage Upload Error:', uploadError);
        if (uploadError.message?.includes('Invalid Compact JWS') || uploadError.message?.includes('API key')) {
          throw new InternalServerErrorException('Supabase Service Role Key is missing or invalid. Please configure SUPABASE_SERVICE_ROLE_KEY in .env');
        }
        throw new InternalServerErrorException(`Storage Error: ${uploadError.message || 'Failed to upload new file'}`);
      }

      const { data: publicUrlData } = this.supabase.storage
        .from('materials')
        .getPublicUrl(fileName);

      fileUrl = publicUrlData.publicUrl;
      fileType = file.originalname.split('.').pop() || null;

      // Extract old file path and remove it (optional cleanup)
      const oldFilePathMatch = material.fileUrl.match(/\/materials\/(.*)$/);
      if (oldFilePathMatch) {
        await this.supabase.storage.from('materials').remove([oldFilePathMatch[1]]);
      }
    }

    return prisma.material.update({
      where: { id },
      data: {
        title: updateMaterialDto.title,
        description: updateMaterialDto.description,
        category: updateMaterialDto.category,
        targetRole: updateMaterialDto.targetRole,
        fileUrl,
        fileType,
      },
    });
  }

  async remove(id: string) {
    const material = await this.findOne(id);
    
    const oldFilePathMatch = material.fileUrl.match(/\/materials\/(.*)$/);
    if (oldFilePathMatch) {
      await this.supabase.storage.from('materials').remove([oldFilePathMatch[1]]);
    }

    await prisma.material.delete({ where: { id } });
    return { success: true };
  }
}
