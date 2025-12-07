import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ExchangeService } from './exchange.service';
import { Currency } from './entities/currency.entity';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { CreateCurrencyDto } from './dtos/create-currency.dto';
import { UpdateCurrencyDto } from './dtos/update-currency.dto';
import { CreateExchangeRateDto } from './dtos/create-exchange-rate.dto';
import { UpdateExchangeRateDto } from './dtos/update-exchange-rate.dto';
import { ExchangeCalculationDto } from './dtos/exchange-calculation.dto';
import { ExchangeCalculationResponseDto } from './dtos/exchange-calculation-response.dto';
import { Public } from '../users/decorators/public.decorator';
import { AdminOnly } from '../users/decorators/admin-only.decorator';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('exchange')
@Controller('exchange')
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  // ==================== Public Endpoints ====================

  @Public()
  @Get('currencies')
  @ApiOperation({ 
    summary: 'Get all active currencies (Public)',
    operationId: 'getActiveCurrencies',
  })
  @ApiOkResponse({
    type: [Currency],
    description: 'List of all active currencies',
  })
  async getActiveCurrencies(): Promise<Currency[]> {
    return await this.exchangeService.findAllCurrencies(true);
  }

  @Public()
  @Get('currencies/:id')
  @ApiOperation({ 
    summary: 'Get currency by ID (Public)',
    operationId: 'getCurrencyById',
  })
  @ApiOkResponse({ type: Currency, description: 'Currency details' })
  @ApiNotFoundResponse({ description: 'Currency not found' })
  async getCurrency(@Param('id') id: string): Promise<Currency> {
    return await this.exchangeService.findOneCurrency(id);
  }

  @Public()
  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate exchange amount (Public)',
    description:
      'Calculate how much you will get when exchanging from one currency to another',
    operationId: 'calculateExchange',
  })
  @ApiOkResponse({
    type: ExchangeCalculationResponseDto,
    description: 'Exchange calculation result',
  })
  @ApiBadRequestResponse({ description: 'Invalid input or currencies' })
  async calculateExchange(
    @Body() calculationDto: ExchangeCalculationDto,
  ): Promise<ExchangeCalculationResponseDto> {
    return await this.exchangeService.calculateExchange(calculationDto);
  }

  // ==================== Admin Endpoints - Currency Management ====================

  @AdminOnly()
  @Post('currencies')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Create a new currency (Admin only)',
    operationId: 'createCurrency',
  })
  @ApiCreatedResponse({ type: Currency, description: 'Currency created' })
  @ApiBadRequestResponse({ description: 'Currency code already exists' })
  async createCurrency(
    @Body() createCurrencyDto: CreateCurrencyDto,
    @CurrentUser() user: User,
  ): Promise<Currency> {
    return await this.exchangeService.createCurrency(
      createCurrencyDto,
      user._id as any,
    );
  }

  @AdminOnly()
  @Get('admin/currencies')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all currencies including inactive (Admin only)',
    operationId: 'getAllCurrencies',
  })
  @ApiOkResponse({
    type: [Currency],
    description: 'List of all currencies',
  })
  async getAllCurrencies(): Promise<Currency[]> {
    return await this.exchangeService.findAllCurrencies(false);
  }

  @AdminOnly()
  @Patch('currencies/:id')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Update currency (Admin only)',
    operationId: 'updateCurrency',
  })
  @ApiOkResponse({ type: Currency, description: 'Currency updated' })
  @ApiNotFoundResponse({ description: 'Currency not found' })
  async updateCurrency(
    @Param('id') id: string,
    @Body() updateCurrencyDto: UpdateCurrencyDto,
  ): Promise<Currency> {
    return await this.exchangeService.updateCurrency(id, updateCurrencyDto);
  }

  @AdminOnly()
  @Delete('currencies/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Delete currency (Admin only)',
    operationId: 'deleteCurrency',
  })
  @ApiNoContentResponse({ description: 'Currency deleted' })
  @ApiNotFoundResponse({ description: 'Currency not found' })
  async removeCurrency(@Param('id') id: string): Promise<void> {
    await this.exchangeService.removeCurrency(id);
  }

  // ==================== Admin Endpoints - Exchange Rate Management ====================

  @AdminOnly()
  @Post('rates')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Create exchange rate (Admin only)',
    operationId: 'createExchangeRate',
  })
  @ApiCreatedResponse({
    type: ExchangeRate,
    description: 'Exchange rate created',
  })
  @ApiBadRequestResponse({
    description: 'Rate already exists for this currency',
  })
  async createExchangeRate(
    @Body() createRateDto: CreateExchangeRateDto,
    @CurrentUser() user: User,
  ): Promise<ExchangeRate> {
    return await this.exchangeService.createExchangeRate(
      createRateDto,
      user._id as any,
    );
  }

  @AdminOnly()
  @Get('admin/rates')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all exchange rates including inactive (Admin only)',
    operationId: 'getAllExchangeRates',
  })
  @ApiOkResponse({
    type: [ExchangeRate],
    description: 'List of all exchange rates',
  })
  async getAllExchangeRates(): Promise<ExchangeRate[]> {
    return await this.exchangeService.findAllExchangeRates(false);
  }

  @AdminOnly()
  @Get('rates')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get all active exchange rates (Admin only)',
    operationId: 'getActiveExchangeRates',
  })
  @ApiOkResponse({
    type: [ExchangeRate],
    description: 'List of active exchange rates',
  })
  async getActiveExchangeRates(): Promise<ExchangeRate[]> {
    return await this.exchangeService.findAllExchangeRates(true);
  }

  @AdminOnly()
  @Get('rates/:id')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get exchange rate by ID (Admin only)',
    operationId: 'getExchangeRateById',
  })
  @ApiOkResponse({ type: ExchangeRate, description: 'Exchange rate details' })
  @ApiNotFoundResponse({ description: 'Exchange rate not found' })
  async getExchangeRate(@Param('id') id: string): Promise<ExchangeRate> {
    return await this.exchangeService.findOneExchangeRate(id);
  }

  @AdminOnly()
  @Patch('rates/:id')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Update exchange rate by ID (Admin only)',
    operationId: 'updateExchangeRate',
  })
  @ApiOkResponse({ type: ExchangeRate, description: 'Exchange rate updated' })
  @ApiNotFoundResponse({ description: 'Exchange rate not found' })
  async updateExchangeRate(
    @Param('id') id: string,
    @Body() updateRateDto: UpdateExchangeRateDto,
  ): Promise<ExchangeRate> {
    return await this.exchangeService.updateExchangeRate(id, updateRateDto);
  }

  @AdminOnly()
  @Patch('rates/currency/:currencyId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update exchange rate by currency ID (Admin only)',
    operationId: 'updateExchangeRateByCurrency',
  })
  @ApiOkResponse({ type: ExchangeRate, description: 'Exchange rate updated' })
  @ApiNotFoundResponse({ description: 'Exchange rate not found' })
  async updateExchangeRateByCurrency(
    @Param('currencyId') currencyId: string,
    @Body() updateRateDto: UpdateExchangeRateDto,
  ): Promise<ExchangeRate> {
    return await this.exchangeService.updateExchangeRateByCurrencyId(
      currencyId,
      updateRateDto,
    );
  }

  @AdminOnly()
  @Delete('rates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Delete exchange rate (Admin only)',
    operationId: 'deleteExchangeRate',
  })
  @ApiNoContentResponse({ description: 'Exchange rate deleted' })
  @ApiNotFoundResponse({ description: 'Exchange rate not found' })
  async removeExchangeRate(@Param('id') id: string): Promise<void> {
    await this.exchangeService.removeExchangeRate(id);
  }

}

