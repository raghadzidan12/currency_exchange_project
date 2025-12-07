import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class ExchangeCalculationDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Source currency ID',
  })
  @IsNotEmpty()
  fromCurrencyId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'Target currency ID',
  })
  @IsNotEmpty()
  toCurrencyId: string;

  @ApiProperty({
    example: 100,
    description: 'Amount to exchange in source currency',
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;
}

