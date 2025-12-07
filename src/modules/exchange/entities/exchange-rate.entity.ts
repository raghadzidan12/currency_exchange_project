import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('exchange_rates')
export class ExchangeRate {
  @ObjectIdColumn({ name: '_id' })
  @ApiProperty()
  _id: ObjectId;

  @Column()
  @ApiProperty({ description: 'Currency ID this rate belongs to' })
  currencyId: ObjectId;

  @Column('decimal', { precision: 18, scale: 6 })
  @ApiProperty({
    example: 0.92,
    description: 'Rate from this currency to USD (1 currency = rateToUSD USD)',
  })
  rateToUSD: number;

  @Column({ default: true })
  @ApiProperty({ default: true, description: 'Whether this rate is active' })
  isActive: boolean;

  @Column({ nullable: true })
  @ApiProperty({
    required: false,
    description: 'Admin user ID who set this rate',
  })
  createdBy?: ObjectId;

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;
}

