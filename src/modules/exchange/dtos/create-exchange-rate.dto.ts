import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateExchangeRateDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Currency ID to set the rate for',
  })
  @IsNotEmpty()
  currencyId: string;

  @ApiProperty({
    example: 0.92,
    description: 'Rate from this currency to USD (1 currency = rateToUSD USD)',
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  rateToUSD: number;

  @ApiProperty({ default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

