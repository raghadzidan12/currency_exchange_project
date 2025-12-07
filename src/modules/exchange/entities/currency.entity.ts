import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('currencies')
export class Currency {
  @ObjectIdColumn({ name: '_id' })
  @ApiProperty()
  _id: ObjectId;

  @Column({ unique: true })
  @ApiProperty({ example: 'USD', description: 'ISO 4217 currency code' })
  code: string;

  @Column()
  @ApiProperty({ example: 'US Dollar', description: 'Currency name' })
  name: string;

  @Column()
  @ApiProperty({ example: '$', description: 'Currency symbol' })
  symbol: string;

  @Column('decimal', { precision: 18, scale: 6, default: 1.0 })
  @ApiProperty({
    example: 1.0,
    description: 'Price to USD: 1 unit of this currency = rateToUSD USD',
  })
  rateToUSD: number;

  @Column({ default: true })
  @ApiProperty({ default: true, description: 'Whether currency is active' })
  isActive: boolean;

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;
}

