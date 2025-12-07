# Currency Exchange API - Frontend Documentation

## Table of Contents
1. [Overview](#overview)
2. [Base URL & Environment](#base-url--environment)
3. [Authentication & Authorization](#authentication--authorization)
4. [User Management](#user-management)
5. [Currency Exchange System](#currency-exchange-system)
6. [Admin Features](#admin-features)
7. [API Endpoints Reference](#api-endpoints-reference)
8. [Request/Response Examples](#requestresponse-examples)
9. [Error Handling](#error-handling)
10. [RTK OpenAPI Integration](#rtk-openapi-integration)
11. [Best Practices](#best-practices)

---

## Overview

This is a Currency Exchange API built with NestJS that allows users to:
- **Public Users**: View active currencies, get currency details, and calculate exchange rates
- **Authenticated Users**: Access their profile information
- **Admin Users**: Manage currencies, exchange rates, and users

### Key Features
- JWT-based authentication
- Role-based access control (Admin/User)
- Currency management with exchange rate calculations
- USD as base currency (all rates are relative to USD)
- Real-time exchange calculations

---

## Base URL & Environment

### Development
```
Base URL: http://localhost:3000
Swagger Docs: http://localhost:3000/docs
OpenAPI JSON: http://localhost:3000/docs-json
```

### API Structure
- All endpoints are prefixed with `/users` or `/exchange`
- Authentication uses Bearer tokens (JWT)
- All responses are in JSON format

---

## Authentication & Authorization

### Authentication Flow

1. **Login** → Get JWT token
2. **Include token** in subsequent requests
3. **Token expires** after 1 day (configurable via `JWT_EXPIRES_IN`)

### How Authentication Works

#### 1. Login Process
```typescript
POST /users/login
Body: { email: string, password: string }
Response: { user: User, accessToken: string, message: string }
```

The login endpoint:
- Validates email and password
- Returns the full user entity (without password)
- Generates a JWT token containing: `{ sub: userId, email, role }`
- Token is valid for 1 day by default

#### 2. Using the Token

For **protected endpoints**, include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

#### 3. Token Validation

The API automatically:
- Extracts token from `Authorization: Bearer <token>` header
- Validates token signature and expiration
- Fetches user from database
- Attaches user to request object
- Validates user role for admin-only endpoints

### Authorization Levels

#### Public Endpoints
- No authentication required
- Marked with `@Public()` decorator
- Examples: Login, Register, Get Currencies, Calculate Exchange

#### Authenticated Endpoints
- Requires valid JWT token
- User must be logged in
- Examples: Get Current User (`/users/me`)

#### Admin-Only Endpoints
- Requires valid JWT token
- User must have `role: 'admin'`
- Marked with `@AdminOnly()` decorator
- Examples: All currency/rate management, user management

### User Roles

```typescript
enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}
```

- **USER**: Default role, can access their own profile
- **ADMIN**: Can manage currencies, rates, and all users

---

## User Management

### User Entity Structure

```typescript
interface User {
  _id: ObjectId;           // MongoDB ObjectId (string in JSON)
  firstName: string;
  lastName: string;
  email: string;          // Unique, lowercase
  password: string;        // Hashed with bcrypt (never returned in responses)
  role: UserRole;         // 'admin' | 'user'
  createdAt?: Date;
  updatedAt?: Date;
}
```

### User Operations

#### Create User (Public)
- Anyone can register
- Password is automatically hashed
- Email is converted to lowercase
- Default role is `'user'`

#### Get Current User
- Requires authentication
- Returns full user profile
- Uses `@CurrentUser()` decorator to get authenticated user

#### Get All Users (Admin Only)
- Returns list of all users
- Password field is excluded from response

---

## Currency Exchange System

### Core Concepts

#### 1. Base Currency: USD
- **USD is the base currency** for all calculations
- USD always has `rateToUSD = 1.0`
- All other currencies have rates relative to USD

#### 2. Exchange Rate Structure

```typescript
interface ExchangeRate {
  _id: ObjectId;
  currencyId: ObjectId;    // Reference to Currency
  rateToUSD: number;       // 1 currency = rateToUSD USD
  isActive: boolean;
  createdBy?: ObjectId;    // Admin who created it
  createdAt: Date;
  updatedAt: Date;
}
```

**Important**: `rateToUSD` means "1 unit of this currency = X USD"

**Examples**:
- USD: `rateToUSD = 1.0` (1 USD = 1 USD)
- EUR: `rateToUSD = 0.92` (1 EUR = 0.92 USD, meaning 1 USD ≈ 1.086 EUR)
- SYP: `rateToUSD = 0.000077` (1 SYP = 0.000077 USD, meaning 1 USD ≈ 13,000 SYP)
- TRY: `rateToUSD = 0.031` (1 TRY = 0.031 USD, meaning 1 USD ≈ 32 TRY)

#### 3. Exchange Calculation Formula

When converting from Currency A to Currency B:

```
Step 1: Convert A to USD
  amountInUSD = amountA * rateA.rateToUSD

Step 2: Convert USD to B
  amountB = amountInUSD / rateB.rateToUSD

Combined Formula:
  exchangeRate = rateA.rateToUSD / rateB.rateToUSD
  amountB = amountA * exchangeRate
```

**Example**: Convert 100 USD to EUR
- USD rate: 1.0
- EUR rate: 0.92
- Exchange rate: 1.0 / 0.92 = 1.086956...
- Result: 100 * 1.086956 = 108.70 EUR

**Example**: Convert 100 EUR to USD
- EUR rate: 0.92
- USD rate: 1.0
- Exchange rate: 0.92 / 1.0 = 0.92
- Result: 100 * 0.92 = 92 USD

### Currency Entity

```typescript
interface Currency {
  _id: ObjectId;
  code: string;           // ISO 4217 code (e.g., 'USD', 'EUR')
  name: string;           // Full name (e.g., 'US Dollar')
  symbol: string;         // Symbol (e.g., '$', '€')
  isActive: boolean;      // Whether currency is active
  createdAt: Date;
  updatedAt: Date;
}
```

### Exchange Calculation Response

```typescript
interface ExchangeCalculationResponse {
  fromCurrencyId: string;
  fromCurrencyCode: string;
  toCurrencyId: string;
  toCurrencyCode: string;
  fromAmount: number;
  toAmount: number;           // Rounded to 6 decimal places
  exchangeRate: number;        // Rounded to 6 decimal places
  calculatedAt: Date;
}
```

---

## Admin Features

### Admin Capabilities

Admins can:
1. **Manage Currencies**
   - Create new currencies
   - View all currencies (including inactive)
   - Update currency details
   - Delete currencies (also deletes associated exchange rates)

2. **Manage Exchange Rates**
   - Create exchange rates for currencies
   - View all rates (active and inactive)
   - Update exchange rates
   - Delete exchange rates
   - Update rate by currency ID

3. **Manage Users**
   - View all users
   - Delete users

### Admin Endpoints Pattern

All admin endpoints:
- Require `Authorization: Bearer <token>` header
- Require user role to be `'admin'`
- Return `403 Forbidden` if user is not admin
- Return `401 Unauthorized` if token is missing/invalid

### Special Rules for USD

- USD rate is **always** `rateToUSD = 1.0`
- Cannot create/update USD rate with different value
- USD rate is automatically created when USD currency is created
- System returns virtual rate for USD if no rate exists in DB

---

## API Endpoints Reference

### User Endpoints

#### Public Endpoints

| Method | Endpoint | Description | Operation ID |
|--------|----------|-------------|---------------|
| POST | `/users/login` | Login user | `loginUser` |
| POST | `/users` | Create new user | `createUser` |
| GET | `/users/public-test` | Public test endpoint | `publicTest` |

#### Authenticated Endpoints

| Method | Endpoint | Description | Operation ID | Auth Required |
|--------|----------|-------------|--------------|---------------|
| GET | `/users/me` | Get current user | `getCurrentUser` | ✅ |
| GET | `/users/:id` | Get user by ID | `getUserById` | ✅ |
| PUT | `/users/:id` | Update user | `updateUser` | ✅ |

#### Admin Only Endpoints

| Method | Endpoint | Description | Operation ID | Admin Required |
|--------|----------|-------------|--------------|----------------|
| GET | `/users` | Get all users | `getAllUsers` | ✅ |
| DELETE | `/users/:id` | Delete user | `deleteUser` | ✅ |

### Exchange Endpoints

#### Public Endpoints

| Method | Endpoint | Description | Operation ID |
|--------|----------|-------------|---------------|
| GET | `/exchange/currencies` | Get active currencies | `getActiveCurrencies` |
| GET | `/exchange/currencies/:id` | Get currency by ID | `getCurrencyById` |
| POST | `/exchange/calculate` | Calculate exchange | `calculateExchange` |

#### Admin Only Endpoints

**Currency Management:**
| Method | Endpoint | Description | Operation ID | Admin Required |
|--------|----------|-------------|--------------|----------------|
| POST | `/exchange/currencies` | Create currency | `createCurrency` | ✅ |
| GET | `/exchange/admin/currencies` | Get all currencies | `getAllCurrencies` | ✅ |
| PATCH | `/exchange/currencies/:id` | Update currency | `updateCurrency` | ✅ |
| DELETE | `/exchange/currencies/:id` | Delete currency | `deleteCurrency` | ✅ |

**Exchange Rate Management:**
| Method | Endpoint | Description | Operation ID | Admin Required |
|--------|----------|-------------|--------------|----------------|
| POST | `/exchange/rates` | Create exchange rate | `createExchangeRate` | ✅ |
| GET | `/exchange/admin/rates` | Get all rates | `getAllExchangeRates` | ✅ |
| GET | `/exchange/rates` | Get active rates | `getActiveExchangeRates` | ✅ |
| GET | `/exchange/rates/:id` | Get rate by ID | `getExchangeRateById` | ✅ |
| PATCH | `/exchange/rates/:id` | Update rate by ID | `updateExchangeRate` | ✅ |
| PATCH | `/exchange/rates/currency/:currencyId` | Update rate by currency | `updateExchangeRateByCurrency` | ✅ |
| DELETE | `/exchange/rates/:id` | Delete rate | `deleteExchangeRate` | ✅ |

---

## Request/Response Examples

### Authentication

#### Login
```http
POST /users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

#### Get Current User
```http
GET /users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "role": "user",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Currency Exchange

#### Get Active Currencies
```http
GET /exchange/currencies
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "code": "USD",
    "name": "US Dollar",
    "symbol": "$",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "code": "EUR",
    "name": "Euro",
    "symbol": "€",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Calculate Exchange
```http
POST /exchange/calculate
Content-Type: application/json

{
  "fromCurrencyId": "507f1f77bcf86cd799439011",
  "toCurrencyId": "507f1f77bcf86cd799439012",
  "amount": 100
}
```

**Response:**
```json
{
  "fromCurrencyId": "507f1f77bcf86cd799439011",
  "fromCurrencyCode": "USD",
  "toCurrencyId": "507f1f77bcf86cd799439012",
  "toCurrencyCode": "EUR",
  "fromAmount": 100,
  "toAmount": 108.695652,
  "exchangeRate": 1.086957,
  "calculatedAt": "2024-01-01T12:00:00.000Z"
}
```

### Admin Operations

#### Create Currency (Admin Only)
```http
POST /exchange/currencies
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "code": "GBP",
  "name": "British Pound",
  "symbol": "£",
  "isActive": true
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "code": "GBP",
  "name": "British Pound",
  "symbol": "£",
  "isActive": true,
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

#### Create Exchange Rate (Admin Only)
```http
POST /exchange/rates
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "currencyId": "507f1f77bcf86cd799439013",
  "rateToUSD": 1.27,
  "isActive": true
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "currencyId": "507f1f77bcf86cd799439013",
  "rateToUSD": 1.27,
  "isActive": true,
  "createdBy": "507f1f77bcf86cd799439015",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | When It Occurs |
|------|---------|----------------|
| 200 | OK | Successful GET, PUT, PATCH requests |
| 201 | Created | Successful POST requests (resource created) |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing/invalid JWT token |
| 403 | Forbidden | User doesn't have required role (admin) |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource (e.g., email already exists) |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Common Error Scenarios

#### 1. Authentication Errors

**Missing Token:**
```json
{
  "statusCode": 401,
  "message": "Please log in to access this resource"
}
```

**Invalid/Expired Token:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

#### 2. Authorization Errors

**Admin Access Required:**
```json
{
  "statusCode": 403,
  "message": "Access denied. Required roles: admin"
}
```

#### 3. Validation Errors

**Invalid Input:**
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

#### 4. Business Logic Errors

**Currency Already Exists:**
```json
{
  "statusCode": 400,
  "message": "Currency with code USD already exists"
}
```

**Exchange Rate Already Exists:**
```json
{
  "statusCode": 400,
  "message": "Exchange rate for currency EUR already exists. Use update instead."
}
```

**Same Currency Conversion:**
```json
{
  "statusCode": 400,
  "message": "Source and target currencies cannot be the same"
}
```

**Inactive Currency:**
```json
{
  "statusCode": 400,
  "message": "One or both currencies are inactive"
}
```

**USD Rate Modification:**
```json
{
  "statusCode": 400,
  "message": "USD always has rateToUSD = 1.0. Cannot set a different rate."
}
```

---

## RTK OpenAPI Integration

### Setup

The API provides OpenAPI JSON at `/docs-json` endpoint, which can be used with RTK Query's code generation.

### Operation IDs

All endpoints have unique `operationId` values for RTK OpenAPI code generation:

**User Operations:**
- `loginUser`
- `getCurrentUser`
- `publicTest`
- `createUser`
- `getAllUsers`
- `getUserById`
- `updateUser`
- `deleteUser`

**Exchange Operations:**
- `getActiveCurrencies`
- `getCurrencyById`
- `calculateExchange`
- `createCurrency`
- `getAllCurrencies`
- `updateCurrency`
- `deleteCurrency`
- `createExchangeRate`
- `getAllExchangeRates`
- `getActiveExchangeRates`
- `getExchangeRateById`
- `updateExchangeRate`
- `updateExchangeRateByCurrency`
- `deleteExchangeRate`

### Response DTOs

All endpoints use proper DTOs for responses, ensuring TypeScript interfaces are generated correctly:

- `LoginResponseDto` - Contains `user`, `accessToken`, `message`
- `User` - User entity (password excluded)
- `Currency` - Currency entity
- `ExchangeRate` - Exchange rate entity
- `ExchangeCalculationResponseDto` - Exchange calculation result
- `PublicTestResponseDto` - Public test response

### Example RTK Query Setup

```typescript
// api.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { openApiBaseQuery } from './openApiBaseQuery';

export const api = createApi({
  baseQuery: openApiBaseQuery({
    baseUrl: 'http://localhost:3000',
  }),
  endpoints: (builder) => ({}),
});

// After code generation, use hooks like:
// const { data, isLoading } = useLoginUserMutation();
// const { data } = useGetActiveCurrenciesQuery();
// const { data } = useCalculateExchangeMutation();
```

---

## Best Practices

### 1. Token Management

- **Store token securely**: Use httpOnly cookies or secure storage
- **Handle token expiration**: Implement refresh logic or redirect to login
- **Include token in headers**: Always use `Authorization: Bearer <token>` for protected endpoints

### 2. Error Handling

- **Check status codes**: Handle 401, 403, 404, 400 appropriately
- **Display user-friendly messages**: Parse error messages for display
- **Handle network errors**: Implement retry logic for network failures

### 3. Exchange Calculations

- **Validate inputs**: Ensure amounts are positive numbers
- **Handle precision**: Results are rounded to 6 decimal places
- **Check currency status**: Only active currencies can be used for calculations
- **Cache currency list**: Fetch currencies once and cache them

### 4. Admin Operations

- **Verify admin status**: Check user role before showing admin UI
- **Handle 403 errors**: Show appropriate message when non-admin tries admin action
- **Confirm destructive actions**: Always confirm before delete operations

### 5. Data Fetching

- **Use RTK Query**: Leverage caching and automatic refetching
- **Optimistic updates**: Update UI optimistically for better UX
- **Pagination**: For large lists, implement pagination (if added to API)

### 6. Type Safety

- **Use generated types**: Import types from RTK OpenAPI generated code
- **Type responses**: Always type your API responses
- **Validate at runtime**: Use runtime validation for critical data

### 7. Security

- **Never expose tokens**: Don't log or expose JWT tokens
- **HTTPS in production**: Always use HTTPS for API calls
- **Validate user input**: Client-side validation + server-side validation

---

## Default Admin User

After running the seeder (`npm run seed`), a default admin user is created:

- **Email**: `admin@example.com`
- **Password**: `Admin123!`
- **Role**: `admin`

**⚠️ Important**: Change the default password in production!

---

## Support & Resources

- **Swagger UI**: `http://localhost:3000/docs` - Interactive API documentation
- **OpenAPI JSON**: `http://localhost:3000/docs-json` - For code generation
- **Base URL**: `http://localhost:3000` - API base URL

---

## Changelog

### Current Version: 1.0

**Features:**
- JWT authentication
- Role-based access control
- Currency management
- Exchange rate calculations
- Admin panel features
- RTK OpenAPI integration support

---

**Last Updated**: 2024

