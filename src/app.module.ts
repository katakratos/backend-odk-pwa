import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CollectesModule } from './collectes/collectes.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017/collecte-cni',
    ),
    CollectesModule,
  ],
})
export class AppModule {}
