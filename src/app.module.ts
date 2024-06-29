import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ImportProductsModule } from './jobs/import_products/import-products.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.DATABASE_URL),

    ScheduleModule.forRoot(),
    ImportProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
