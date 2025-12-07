import { ApiProperty } from '@nestjs/swagger';

export class ExchangeCalculationResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Source currency ID' })
  fromCurrencyId: string;

  @ApiProperty({ example: 'USD', description: 'Source currency code' })
  fromCurrencyCode: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012', description: 'Target currency ID' })
  toCurrencyId: string;

  @ApiProperty({ example: 'EUR', description: 'Target currency code' })
  toCurrencyCode: string;

  @ApiProperty({ example: 100, description: 'Amount in source currency' })
  fromAmount: number;

  @ApiProperty({
    example: 92,
    description: 'Calculated amount in target currency',
  })
  toAmount: number;

  @ApiProperty({
    example: 0.92,
    description: 'Exchange rate used for conversion',
  })
  exchangeRate: number;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Timestamp of calculation',
  })
  calculatedAt: Date;
}

