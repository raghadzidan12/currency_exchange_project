import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';

export class CreateCurrencyDto {
  @ApiProperty({ example: 'USD', description: 'ISO 4217 currency code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'US Dollar', description: 'Currency name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '$', description: 'Currency symbol' })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({
    example: 1.0,
    description: 'Price to USD: 1 unit of this currency = rateToUSD USD',
    default: 1.0,
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

