import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/users/user.module';
import { ExchangeModule } from './modules/exchange/exchange.module';
import { ContactModule } from './modules/contact/contact.module';
import { ConfigProps } from './types/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigProps>) => ({
        entities: [
          __dirname + '/**/*.entity{.ts,.js}',
          __dirname + '/**/**/*.entity{.ts,.js}',
          __dirname + '/**/**/**/*.entity{.ts,.js}',
          __dirname + '/**/**/**/**/*.entity{.ts,.js}',
          __dirname + '/**/**/**/**/**/*.entity{.ts,.js}',
        ],

        type: 'mongodb',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
        retryAttempts: 2,
      }),
    }),

    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),

    // RatesModule,
    UserModule,
    ExchangeModule,
    ContactModule,
  ],
})
export class AppModule {}
