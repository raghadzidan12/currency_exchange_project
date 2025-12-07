import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class UpdateExchangeRateDto {
  @ApiProperty({
    required: false,
    example: 0.92,
    description: 'Rate from this currency to USD',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rateToUSD?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

