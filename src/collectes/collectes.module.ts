import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CollectesController } from './collectes.controller';
import { CollectesService } from './collectes.service';
import { Collecte, CollecteSchema } from './schemas/collecte.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Collecte.name, schema: CollecteSchema }]),
  ],
  controllers: [CollectesController],
  providers: [CollectesService],
})
export class CollectesModule {}
