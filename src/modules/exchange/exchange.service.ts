import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Currency } from './entities/currency.entity';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { CreateCurrencyDto } from './dtos/create-currency.dto';
import { UpdateCurrencyDto } from './dtos/update-currency.dto';
import { CreateExchangeRateDto } from './dtos/create-exchange-rate.dto';
import { UpdateExchangeRateDto } from './dtos/update-exchange-rate.dto';
import { ExchangeCalculationDto } from './dtos/exchange-calculation.dto';
import { ExchangeCalculationResponseDto } from './dtos/exchange-calculation-response.dto';

@Injectable()
export class ExchangeService {
  constructor(
    @InjectRepository(Currency)
    private currencyRepository: Repository<Currency>,
    @InjectRepository(ExchangeRate)
    private exchangeRateRepository: Repository<ExchangeRate>,
  ) {}

  // ==================== Currency CRUD ====================

  async createCurrency(
    createCurrencyDto: CreateCurrencyDto,
    userId?: ObjectId,
  ): Promise<Currency> {
    // Check if currency code already exists
    const code = createCurrencyDto.code.toUpperCase();
    const existing = await this.currencyRepository.findOne({
      where: { code },
    });

    if (existing) {
      throw new BadRequestException(
        `Currency with code ${createCurrencyDto.code} already exists`,
      );
    }

    // USD always has rateToUSD = 1.0
    const rateToUSD = code === 'USD' ? 1.0 : createCurrencyDto.rateToUSD;

    const currency = this.currencyRepository.create({
      ...createCurrencyDto,
      code,
      rateToUSD,
    });

    const savedCurrency = await this.currencyRepository.save(currency);

    // If USD, automatically create exchange rate with rateToUSD = 1.0
    if (code === 'USD') {
      const existingRate = await this.exchangeRateRepository.findOne({
        where: { currencyId: savedCurrency._id } as any,
      });

      if (!existingRate) {
        await this.exchangeRateRepository.save({
          currencyId: savedCurrency._id,
          rateToUSD: 1.0,
          isActive: true,
        } as any);
      }
    }

    return savedCurrency;
  }

  async findAllCurrencies(activeOnly = false): Promise<Currency[]> {
    const where = activeOnly ? { isActive: true } : {};
    return await this.currencyRepository.find({
      where,
      order: { code: 'ASC' },
    });
  }

  async findOneCurrency(_id: string | ObjectId): Promise<Currency> {
    const objectId = _id instanceof ObjectId ? _id : new ObjectId(_id);
    const currency = await this.currencyRepository.findOne({
      where: { _id: objectId } ,
    });

    if (!currency) {
      throw new NotFoundException(`Currency with ID ${_id} not found`);
    }

    return currency;
  }

  async findCurrencyByCode(code: string): Promise<Currency> {
    const currency = await this.currencyRepository.findOne({
      where: { code: code.toUpperCase() },
    });

    if (!currency) {
      throw new NotFoundException(`Currency with code ${code} not found`);
    }

    return currency;
  }

  async updateCurrency(
    _id: string | ObjectId,
    updateCurrencyDto: UpdateCurrencyDto,
  ): Promise<Currency> {
    const currency = await this.findOneCurrency(_id);

    // USD always has rateToUSD = 1.0, don't allow changing it
    if (currency.code === 'USD' && updateCurrencyDto.rateToUSD !== undefined) {
      if (updateCurrencyDto.rateToUSD !== 1.0) {
        throw new BadRequestException(
          'USD always has rateToUSD = 1.0. Cannot change this rate.',
        );
      }
      // Ensure it's set to 1.0 even if they try to set it
      updateCurrencyDto.rateToUSD = 1.0;
    }

    Object.assign(currency, updateCurrencyDto);
    return await this.currencyRepository.save(currency);
  }

  async removeCurrency(_id: string | ObjectId): Promise<void> {
    const currency = await this.findOneCurrency(_id);

    // Check if currency has an exchange rate and remove it
    const objectId = _id instanceof ObjectId ? _id : new ObjectId(_id);
    const exchangeRate = await this.exchangeRateRepository.findOne({
      where: { currencyId: objectId } as any,
    });
    if (exchangeRate) {
      await this.exchangeRateRepository.remove(exchangeRate);
    }

    await this.currencyRepository.remove(currency);
  }

  // ==================== Exchange Rate CRUD ====================

  async createExchangeRate(
    createRateDto: CreateExchangeRateDto,
    userId?: ObjectId,
  ): Promise<ExchangeRate> {
    // Verify currency exists and get its _id
    const currency = await this.findOneCurrency(createRateDto.currencyId);
    const currencyObjectId = currency._id; // Use the actual _id from the currency

    // USD always has rateToUSD = 1.0, don't allow creating different rate
    if (currency.code === 'USD') {
      if (createRateDto.rateToUSD !== 1.0) {
        throw new BadRequestException(
          'USD always has rateToUSD = 1.0. Cannot set a different rate.',
        );
      }
    }

    // Check if rate already exists for this currency
    const existing = await this.exchangeRateRepository.findOne({
      where: { currencyId: currencyObjectId },
    });

    if (existing) {
      throw new BadRequestException(
        `Exchange rate for currency ${currency.code} already exists. Use update instead.`,
      );
    }

    // For USD, ensure rateToUSD is 1.0
    const rateToUSD = currency.code === 'USD' ? 1.0 : createRateDto.rateToUSD;

    const rate = this.exchangeRateRepository.create({
      currencyId: currencyObjectId,
      rateToUSD,
      isActive: createRateDto.isActive ?? true,
      createdBy: userId,
    } as any);

    const saved = await this.exchangeRateRepository.save(rate);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async findAllExchangeRates(activeOnly = false): Promise<ExchangeRate[]> {
    const where = activeOnly ? { isActive: true } : {};
    return await this.exchangeRateRepository.find({
      where,
      order: { currencyId: 'ASC' },
    });
  }

  async findOneExchangeRate(_id: string | ObjectId): Promise<ExchangeRate> {
    const objectId = _id instanceof ObjectId ? _id : new ObjectId(_id);
    const rate = await this.exchangeRateRepository.findOne({
      where: { _id: objectId } as any,
    });

    if (!rate) {
      throw new NotFoundException(`Exchange rate with ID ${_id} not found`);
    }

    return rate;
  }

  async findExchangeRateByCurrencyId(
    currencyId: string | ObjectId,
  ): Promise<ExchangeRate> {
    // First, get the currency to ensure we have the correct _id
    const currency = await this.findOneCurrency(currencyId);
    const currencyObjectId = currency._id; // Use the actual _id from the currency
    
    // If USD, return a virtual rate with rateToUSD = 1.0
    if (currency.code === 'USD') {
      return {
        _id: currencyObjectId, // Use currency _id as a placeholder
        currencyId: currencyObjectId,
        rateToUSD: 1.0,
        isActive: true,
        createdAt: currency.createdAt || new Date(),
        updatedAt: currency.updatedAt || new Date(),
      } as ExchangeRate;
    }
    
    // Query using the currency's _id
    const rate = await this.exchangeRateRepository.findOne({
      where: { currencyId: currencyObjectId, isActive: true },
    });

    if (!rate) {
      throw new NotFoundException(
        `Active exchange rate for currency ${currency.code} not found. Please create an exchange rate for this currency.`,
      );
    }

    return rate;
  }

  async updateExchangeRate(
    _id: string | ObjectId,
    updateRateDto: UpdateExchangeRateDto,
  ): Promise<ExchangeRate> {
    const rate = await this.findOneExchangeRate(_id);
    
    // Get the currency to check if it's USD
    const currency = await this.findOneCurrency(rate.currencyId);
    
    // USD always has rateToUSD = 1.0, don't allow changing it
    if (currency.code === 'USD' && updateRateDto.rateToUSD !== undefined && updateRateDto.rateToUSD !== 1.0) {
      throw new BadRequestException(
        'USD always has rateToUSD = 1.0. Cannot change this rate.',
      );
    }

    // If trying to update USD rate, ensure it stays 1.0
    if (currency.code === 'USD' && updateRateDto.rateToUSD !== undefined) {
      updateRateDto.rateToUSD = 1.0;
    }

    Object.assign(rate, updateRateDto);
    return await this.exchangeRateRepository.save(rate);
  }

  async updateExchangeRateByCurrencyId(
    currencyId: string | ObjectId,
    updateRateDto: UpdateExchangeRateDto,
  ): Promise<ExchangeRate> {
    const currency = await this.findOneCurrency(currencyId);
    
    // USD always has rateToUSD = 1.0, don't allow changing it
    if (currency.code === 'USD' && updateRateDto.rateToUSD !== undefined && updateRateDto.rateToUSD !== 1.0) {
      throw new BadRequestException(
        'USD always has rateToUSD = 1.0. Cannot change this rate.',
      );
    }

    // If trying to update USD rate, ensure it stays 1.0
    if (currency.code === 'USD' && updateRateDto.rateToUSD !== undefined) {
      updateRateDto.rateToUSD = 1.0;
    }

    const rate = await this.findExchangeRateByCurrencyId(currencyId);

    // If USD, we return a virtual rate, so we need to create/update the actual rate in DB
    if (currency.code === 'USD') {
      const existingRate = await this.exchangeRateRepository.findOne({
        where: { currencyId: currency._id },
      });
      
      if (existingRate) {
        Object.assign(existingRate, updateRateDto);
        return await this.exchangeRateRepository.save(existingRate);
      } else {
        // Create USD rate if it doesn't exist
        const newRate = this.exchangeRateRepository.create({
          currencyId: currency._id,
          rateToUSD: 1.0,
          isActive: updateRateDto.isActive ?? true,
        } as any);
        const saved = await this.exchangeRateRepository.save(newRate);
        return Array.isArray(saved) ? saved[0] : saved;
      }
    }

    Object.assign(rate, updateRateDto);
    return await this.exchangeRateRepository.save(rate);
  }

  async removeExchangeRate(_id: string | ObjectId): Promise<void> {
    const rate = await this.findOneExchangeRate(_id);
    await this.exchangeRateRepository.remove(rate);
  }

  // ==================== Exchange Calculation ====================

  async calculateExchange(
    calculationDto: ExchangeCalculationDto,
  ): Promise<ExchangeCalculationResponseDto> {
    const { fromCurrencyId, toCurrencyId, amount } = calculationDto;

    // Validate currencies are different
    if (fromCurrencyId === toCurrencyId) {
      throw new BadRequestException(
        'Source and target currencies cannot be the same',
      );
    }

    // Get currencies
    const fromCurrency = await this.findOneCurrency(calculationDto.fromCurrencyId);
    const toCurrency = await this.findOneCurrency(calculationDto.toCurrencyId);

    // Verify currencies are active
    if (!fromCurrency.isActive || !toCurrency.isActive) {
      throw new BadRequestException('One or both currencies are inactive');
    }

    // Use rateToUSD directly from currency entities
    // Calculate exchange
    // Formula: amount * (fromCurrency.rateToUSD / toCurrency.rateToUSD)
    // This converts: Currency A -> USD -> Currency B
    const exchangeRate = fromCurrency.rateToUSD / toCurrency.rateToUSD;
    const toAmount = amount * exchangeRate;

    const result: ExchangeCalculationResponseDto = {
      fromCurrencyId: fromCurrency._id.toString(),
      fromCurrencyCode: fromCurrency.code,
      toCurrencyId: toCurrency._id.toString(),
      toCurrencyCode: toCurrency.code,
      fromAmount: amount,
      toAmount: Number(toAmount.toFixed(6)), // Round to 6 decimal places
      exchangeRate: Number(exchangeRate.toFixed(6)),
      calculatedAt: new Date(),
    };

    return result;
  }
}

