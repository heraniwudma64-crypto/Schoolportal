import { Module } from '@nestjs/common';
<<<<<<< HEAD

@Module({})
=======
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';

@Module({
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
>>>>>>> e52a24ea29f3dbed57cfdb5f60aa5e20f9d2173b
export class StudentsModule {}
