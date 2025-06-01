# Day-Mood Backend Documentation

## Overview

Day-Mood is a mobile application backend API that allows users to track their daily moods, activities, and reflections. The backend provides a RESTful API built with NestJS and uses Prisma ORM with PostgreSQL for data persistence.

## Tech Stack

- **Framework**: NestJS 9.4.0
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with Passport.js
- **Documentation**: Swagger/OpenAPI

## Database Schema

The application uses the following data models:

### Users

Stores user authentication and profile information:

- `id`: Unique identifier (BigInt)
- `email`: User's email address (unique)
- `username`: User's display name
- `password`: Hashed password
- `phone`: Contact number (optional)
- `gender`: User's gender (optional)
- `age`: User's age (optional)

### Moods

Predefined mood options users can select:

- `id`: Unique identifier
- `name`: Name of the mood
- `color`: Color code associated with the mood
- `icon`: Icon name or path
- `created_time`: Creation timestamp
- `updated_time`: Last update timestamp

### Activities

Predefined activities users can associate with their moods:

- `id`: Unique identifier
- `icon`: Icon name or path
- `description`: Text description of the activity
- `created_time`: Creation timestamp
- `updated_time`: Last update timestamp

### Records

User entries combining mood, activity, and notes:

- `id`: Unique identifier
- `note`: User's written reflection
- `created_time`: Creation timestamp
- `updated_time`: Last update timestamp
- `mood_id`: Associated mood
- `activity_id`: Associated activity
- `user_id`: Owner of the record
- `status`: Record status (ACTIVE, DRAFT, DELETED)

### Files

Media files uploaded by users:

- `id`: Unique identifier
- `fname`: File name
- `type`: MIME type
- `url`: Access URL
- `fkey`: Storage key
- `size`: File size

### Record Assets

Junction table linking records with attached files:

- `id`: Unique identifier
- `record_id`: Associated record
- `file_id`: Associated file
- `created_at`: Creation timestamp

## API Endpoints

### Authentication

- **POST /auth/register**: Register a new user
- **POST /auth/login**: Authenticate and receive JWT tokens
- **POST /auth/refresh**: Refresh access token using refresh token
- **POST /auth/logout**: Invalidate current tokens

### Users

- **GET /users**: Get list of users (admin only)
- **GET /users/:id**: Get user details
- **PATCH /users/:id**: Update user profile
- **DELETE /users/:id**: Delete user account

### Moods

- **GET /moods**: Get all available moods
- **POST /moods**: Create a new mood (admin only)
- **PATCH /moods/:id**: Update mood (admin only)
- **DELETE /moods/:id**: Delete mood (admin only)

### Activities

- **GET /activities**: Get all available activities
- **POST /activities**: Create a new activity (admin only)
- **PATCH /activities/:id**: Update activity (admin only)
- **DELETE /activities/:id**: Delete activity (admin only)

### Records

- **GET /records**: Get user's records (supports filtering by date/mood/activity)
- **POST /records**: Create a new record
- **GET /records/:id**: Get record details
- **PATCH /records/:id**: Update a record
- **DELETE /records/:id**: Delete a record (soft delete)

### Files

- **POST /files/upload**: Upload a file
- **GET /files/:id**: Get file details
- **DELETE /files/:id**: Delete a file

## Authentication

The API uses JWT (JSON Web Tokens) for authentication with two token types:

- **Access Token**: Short-lived token (15 minutes) for API access
- **Refresh Token**: Long-lived token (7 days) to obtain new access tokens

All protected endpoints require a valid access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

## Installation & Setup

### Prerequisites

- Node.js (v14+)
- PostgreSQL
- npm or yarn

### Installation Steps

1. Clone the repository:
   ```bash
   git clone <repository_url>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables: Create a `.env` file in the root directory with the following variables:
   ```env
   DATABASE_URL=<your_postgresql_connection_string>
   JWT_SECRET=<your_jwt_secret>
   # Add other necessary variables
   ```
4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```
5. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
6. Start the application:
   ```bash
   npm run start
   ```

The API will be available at `http://localhost:3000`.

## API Documentation

Swagger documentation is available at `http://localhost:3000/api`.

## Development

### Available Scripts

- `npm run build`: Build the application
- `npm run format`: Format code with Prettier
- `npm run start`: Start the application
- `npm run dev`: Start with hot-reload (development)
- `npm run lint`: Run ESLint
- `npm run test`: Run tests
- `npm run test:e2e`: Run end-to-end tests

## Deployment

For production deployment:

1. Build the application:
   ```bash
   npm run build
   ```
2. Set `NODE_ENV` to `production`:
   ```bash
   export NODE_ENV=production
   ```
3. Start the server:
   ```bash
   npm run start:prod
   ```

## Error Handling

The API uses standard HTTP status codes:

- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid input
- **401 Unauthorized**: Authentication required or failed
- **403 Forbidden**: Permission denied
- **404 Not Found**: Resource not found
- **500 Server Error**: Internal server error

Error responses include an error message and details when applicable.

## Data Validation

Input validation is performed using `class-validator` and `class-transformer` with DTO (Data Transfer Object) patterns.

## Contributors

- Original development by Hỏi Dân IT

## License

UNLICENSED

<!-- VERSION_BADGE_PLACEHOLDER -->
[![Version](https://img.shields.io/badge/version-v0.0.10-blue)](https://github.com/Enigmask22/DayMood-Backend/releases/tag/v0.0.10)
[![Version](https://img.shields.io/badge/version-v0.0.10-blue)](https://github.com/Enigmask22/DayMood-Backend/releases/tag/v0.0.10)
[![Version](https://img.shields.io/badge/version-v0.0.9-blue)](https://github.com/Enigmask22/DayMood-Backend/releases/tag/v0.0.9)
[![Version](https://img.shields.io/badge/version-v0.0.9-blue)](https://github.com/Enigmask22/DayMood-Backend/releases/tag/v0.0.9)
[![Version](https://img.shields.io/badge/version-v0.0.8-blue)](https://github.com/Enigmask22/DayMood-Backend/releases/tag/v0.0.8)
[![Version](https://img.shields.io/badge/version-v0.0.7-blue)](https://github.com/Enigmask22/DayMood-Backend/releases/tag/v0.0.7)
[![Version](https://img.shields.io/badge/version-v0.0.6-blue)](https://github.com/Enigmask22/DayMood-Backend/releases/tag/v0.0.6)
[![Version](https://img.shields.io/badge/version-v0.0.6-blue)](https://github.com/Enigmask22/DayMood-Backend/releases/tag/v0.0.6)
[![Version](https://img.shields.io/badge/version-v0.0.5-blue)](https://github.com/hungdt31/day-mood-backend/releases/tag/v0.0.5)
[![Version](https://img.shields.io/badge/version-v0.0.5-blue)](https://github.com/hungdt31/day-mood-backend/releases/tag/v0.0.5)
[![Version](https://img.shields.io/badge/version-v0.0.4-blue)](https://github.com/hungdt31/day-mood-backend/releases/tag/v0.0.4)
[![Version](https://img.shields.io/badge/version-v0.0.3-blue)](https://github.com/hungdt31/day-mood-backend/releases/tag/v0.0.3)
[![Version](https://img.shields.io/badge/version-v0.0.3-blue)](https://github.com/hungdt31/day-mood-backend/releases/tag/v0.0.3)
[![Version](https://img.shields.io/badge/version-v0.0.2-blue)](https://github.com/hungdt31/day-mood-backend/releases/tag/v0.0.2)
