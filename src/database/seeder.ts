import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../modules/users/services/user.service';
import { ExchangeService } from '../modules/exchange/exchange.service';
import { UserRole } from '../modules/users/constants';
import { ObjectId } from 'mongodb';
import * as bcrypt from 'bcrypt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Currency } from '../modules/exchange/entities/currency.entity';
import { ExchangeRate } from '../modules/exchange/entities/exchange-rate.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const userService = app.get(UserService);
  const exchangeService = app.get(ExchangeService);
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const currencyRepository = app.get<Repository<Currency>>(getRepositoryToken(Currency));
  const exchangeRateRepository = app.get<Repository<ExchangeRate>>(getRepositoryToken(ExchangeRate));

  console.log('🌱 Starting database seeder...\n');

  try {
    // ==================== Seed Admin User ====================
    console.log('👤 Seeding admin user...');
    const adminEmail = 'admin@example.com';
    const adminPassword = 'Admin123!';
    
    const existingAdmin = await userService.findByEmail(adminEmail);
    if (existingAdmin) {
      console.log('   ⚠️  Admin user already exists, skipping...');
    } else {
      // Hash password manually (BeforeInsert hook may not fire with repository.create)
      
      const adminUser = userRepository.create({
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail.toLowerCase(),
        password: adminPassword,
        role: UserRole.ADMIN,
      });
      
      const savedAdmin = await userRepository.save(adminUser);
      console.log(`   ✅ Admin user created successfully!`);
      console.log(`      Email: ${adminEmail}`);
      console.log(`      Password: ${adminPassword}`);
      console.log(`      ID: ${savedAdmin._id}\n`);
    }

    // Get admin user ID for exchange rate creation
    const adminUser = await userService.findByEmail(adminEmail);
    const adminUserId = adminUser?._id || new ObjectId();

    // ==================== Seed Currencies ====================
    console.log('💱 Seeding currencies...');
    
    const currencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$', rateToUSD: 1.0 },
      { code: 'SYP', name: 'Syrian Pound', symbol: '£', rateToUSD: 0.000077 },
      { code: 'EUR', name: 'Euro', symbol: '€', rateToUSD: 0.92 },
      { code: 'TRY', name: 'Turkish Lira', symbol: '₺', rateToUSD: 0.031 },
    ];

    // Default exchange rates (rateToUSD means: 1 currency = rateToUSD USD)
    // USD: 1.0 (Base currency: 1 USD = 1 USD)
    // SYP: 0.000077 (1 SYP = 0.000077 USD, approximately 1 USD = 13000 SYP)
    // EUR: 0.92 (1 EUR = 0.92 USD, approximately 1 USD = 1.086 EUR)
    // TRY: 0.031 (1 TRY = 0.031 USD, approximately 1 USD = 32 TRY)

    for (const currencyData of currencies) {
      try {
        // Check if currency already exists
        const existing = await currencyRepository.findOne({
          where: { code: currencyData.code },
        });

        if (existing) {
          console.log(`   ⚠️  Currency ${currencyData.code} already exists, skipping...`);
        } else {
          const currency = await exchangeService.createCurrency(
            {
              code: currencyData.code,
              name: currencyData.name,
              symbol: currencyData.symbol,
              rateToUSD: currencyData.rateToUSD,
              isActive: true,
            },
            adminUserId,
          );
          console.log(`   ✅ Currency ${currency.code} (${currency.name}) created with rateToUSD: ${currency.rateToUSD}!`);
          console.log(`      (1 ${currency.code} = ${currency.rateToUSD} USD)`);
        }
      } catch (error) {
        console.error(`   ❌ Error creating currency ${currencyData.code}:`, error.message);
      }
    }

    console.log('\n🎉 Seeder completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Admin user: admin@example.com / Admin123!');
    console.log('   - Currencies: USD (base), SYP, EUR, TRY');
    console.log('   - All currencies include rateToUSD field\n');
  } catch (error) {
    console.error('❌ Seeder failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap();

