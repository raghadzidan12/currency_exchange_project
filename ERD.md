# Currency Exchange System - Entity Relationship Diagram

## Overview
This system allows admins to manage currencies and their exchange rates to USD (main currency), and enables public users to query exchange calculations (how much they will get when exchanging from one currency to another). Users do not hold balances - they only query exchange rates and amounts.

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER                                     │
├─────────────────────────────────────────────────────────────────┤
│ PK  id: number                                                  │
│     firstName: string                                           │
│     lastName: string                                            │
│     email: string (unique)                                      │
│     password: string (hashed)                                   │
│     role: UserRole (ADMIN | USER)                               │
│     createdAt: Date                                             │
│     updatedAt: Date                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1
                              │
                              │ creates/manages
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CURRENCY                                    │
├─────────────────────────────────────────────────────────────────┤
│ PK  id: number                                                  │
│     code: string (unique) - ISO 4217 (e.g., "USD", "EUR")      │
│     name: string (e.g., "US Dollar", "Euro")                    │
│     symbol: string (e.g., "$", "€")                             │
│     isActive: boolean                                           │
│     createdBy: number (FK -> User.id)                          │
│     createdAt: Date                                             │
│     updatedAt: Date                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1
                              │
                              │ has
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXCHANGE_RATE                                │
├─────────────────────────────────────────────────────────────────┤
│ PK  id: number                                                  │
│ FK  currencyId: number -> Currency.id                          │
│     rateToUSD: decimal - Rate from this currency to USD        │
│     buyRate: decimal - Rate for buying (optional, for spread)  │
│     sellRate: decimal - Rate for selling (optional, for spread)│
│     isActive: boolean                                           │
│     createdBy: number (FK -> User.id) - Admin who set the rate │
│     createdAt: Date                                             │
│     updatedAt: Date                                             │
│                                                                 │
│ Note: USD itself will have rateToUSD = 1.0                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ N
                              │
                              │ tracks
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  EXCHANGE_QUERY                                  │
│              (Optional - for tracking queries)                  │
├─────────────────────────────────────────────────────────────────┤
│ PK  id: number                                                  │
│ FK  userId: number -> User.id (nullable for public/guest)      │
│ FK  fromCurrencyId: number -> Currency.id                      │
│ FK  toCurrencyId: number -> Currency.id                        │
│     fromAmount: decimal - Amount user wants to exchange         │
│     toAmount: decimal - Calculated amount in target currency   │
│     exchangeRate: decimal - Rate used for conversion            │
│     ipAddress: string (optional - for guest tracking)          │
│     createdAt: Date                                             │
│                                                                 │
│ Note: This is optional - only for tracking user queries        │
│       Users don't need accounts to query exchange rates        │
└─────────────────────────────────────────────────────────────────┘
```

## Relationships

1. **User → Currency** (1:N)
   - One admin user can create multiple currencies
   - Relationship: `createdBy` field in Currency

2. **User → ExchangeRate** (1:N)
   - One admin user can set multiple exchange rates
   - Relationship: `createdBy` field in ExchangeRate

3. **Currency → ExchangeRate** (1:1)
   - Each currency has one active exchange rate to USD
   - Relationship: `currencyId` field in ExchangeRate

4. **User → ExchangeQuery** (1:N) - Optional
   - One user can have multiple exchange queries (for logged-in users)
   - Relationship: `userId` field in ExchangeQuery (nullable for public/guest users)
   - Note: Public users can query without accounts

5. **Currency → ExchangeQuery** (1:N) - Optional
   - One currency can be used in multiple queries (as source or target)
   - Relationships: `fromCurrencyId` and `toCurrencyId` in ExchangeQuery

## Key Design Decisions

### 0. No User Balances
- **Users do NOT have account balances or wallets**
- Users can query exchange calculations without accounts (public access)
- The system is a **calculator/query tool**, not a wallet or exchange platform
- Users input: "I want to exchange X amount of Currency A"
- System returns: "You will get Y amount of Currency B"
- No actual money is stored or transferred

### 1. USD as Base Currency
- All exchange rates are stored relative to USD
- To convert between any two currencies (e.g., EUR → GBP):
  - EUR → USD: Use `ExchangeRate.rateToUSD` for EUR
  - USD → GBP: Use `1 / ExchangeRate.rateToUSD` for GBP
  - Formula: `EUR_amount * EUR_rateToUSD / GBP_rateToUSD = GBP_amount`

### 2. Exchange Rate Management
- Only admins can create/update currencies and exchange rates
- Each currency has one active exchange rate to USD
- Historical rates can be tracked via `createdAt` timestamps

### 3. Exchange Query Tracking (Optional)
- Exchange queries can be logged in ExchangeQuery table for analytics
- Supports both authenticated users and public/guest users
- Public users can query exchange rates without creating accounts
- Stores the exact rate used at the time of query
- This is optional - the system can work without tracking queries

### 4. Currency Status
- Currencies can be activated/deactivated without deletion
- Only active currencies appear in exchange options

## Enums

```typescript
enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

// No enums needed for ExchangeQuery - it's just a calculation/query log
```

## Example Data Flow

### Admin Sets Exchange Rate:
1. Admin creates/updates Currency (e.g., EUR)
2. Admin sets ExchangeRate: EUR → USD = 0.92
3. System stores: `{ currencyId: EUR.id, rateToUSD: 0.92 }`

### User Queries Exchange Calculation:
1. User (public or logged-in) wants to know: "How much is 100 EUR in GBP?"
2. System fetches:
   - EUR rate: `rateToUSD = 0.92`
   - GBP rate: `rateToUSD = 0.79`
3. Calculation:
   - 100 EUR = 100 × 0.92 = 92 USD
   - 92 USD = 92 / 0.79 = 116.46 GBP
4. System optionally creates ExchangeQuery record (for analytics)
5. Returns: `{ fromAmount: 100, toAmount: 116.46, exchangeRate: 0.92/0.79 }`
6. **No actual money transfer happens** - this is just a calculation/query

## MongoDB Considerations

Since this project uses MongoDB, the relationships are implemented as:
- **Embedded References**: Store ObjectId references
- **Denormalization**: Consider embedding frequently accessed data
- **Indexes**: Create indexes on:
  - `Currency.code` (unique)
  - `ExchangeRate.currencyId` + `isActive`
  - `ExchangeQuery.userId` (if tracking queries)
  - `ExchangeQuery.createdAt` (if tracking queries)

