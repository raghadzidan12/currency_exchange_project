import { ApiProperty } from '@nestjs/swagger';

export class PublicTestResponseDto {
  @ApiProperty({ example: 'This is a public endpoint - no authentication required!' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;
}

