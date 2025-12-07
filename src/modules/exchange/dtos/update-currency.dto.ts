import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';

export class UpdateCurrencyDto {
  @ApiProperty({ required: false, example: 'US Dollar' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, example: '$' })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiProperty({
    required: false,
    example: 1.0,
    description: 'Price to USD: 1 unit of this currency = rateToUSD USD',
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

