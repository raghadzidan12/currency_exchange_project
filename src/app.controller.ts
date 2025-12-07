import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { HelloResponseDto } from './app.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get hello message',
    operationId: 'getHello',
  })
  @ApiOkResponse({ 
    type: HelloResponseDto,
    description: 'Hello message',
  })
  getHello(): HelloResponseDto {
    return { message: this.appService.getHello() };
  }
}
