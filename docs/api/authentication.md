# Authentication API

Base path: `/api/v1/auth`

## POST /api/v1/auth/register

Create a new user account.

**Request Body:**
```json
{
  "email": "farmer@example.com",
  "password": "SecurePass123!",
  "username": "greenfarmer",
  "displayName": "Green Farmer",
  "phone": "+1234567890"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "farmer@example.com",
    "username": "greenfarmer",
    "isVerified": false
  },
  "message": "Account created. Please verify your email with the OTP sent."
}
```

**Errors:** `400` (validation), `409` (email/username exists)

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"farmer@example.com","password":"SecurePass123!","username":"greenfarmer"}'
```

---

## POST /api/v1/auth/login

Authenticate with email and password.

**Request Body:**
```json
{
  "email": "farmer@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "email": "farmer@example.com",
      "username": "greenfarmer",
      "role": "USER",
      "avatarUrl": null
    }
  }
}
```

**Errors:** `401` (invalid credentials), `403` (account suspended)

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"farmer@example.com","password":"SecurePass123!"}'
```

---

## POST /api/v1/auth/refresh

Refresh an expired access token.

**Request Body:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "expiresIn": 900
  }
}
```

**Errors:** `401` (invalid/expired refresh token)

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"dGhpcyBpcyBhIHJlZnJl..."}'
```

---

## POST /api/v1/auth/verify-otp

Verify email/phone with OTP.

**Request Body:**
```json
{
  "email": "farmer@example.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "isVerified": true,
    "accessToken": "eyJhbGciOiJSUzI1NiIs..."
  },
  "message": "Email verified successfully"
}
```

**Errors:** `400` (invalid OTP), `429` (too many attempts)

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"farmer@example.com","otp":"123456"}'
```

---

## POST /api/v1/auth/forgot-password

Request password reset email.

**Request Body:**
```json
{
  "email": "farmer@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset link sent to email"
}
```

**Errors:** `404` (email not found)

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"farmer@example.com"}'
```

---

## POST /api/v1/auth/reset-password

Reset password with token from email.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "password": "NewSecurePass456!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Errors:** `400` (invalid/expired token), `422` (weak password)

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"reset-token","password":"NewSecurePass456!"}'
```

---

## POST /api/v1/auth/telegram/link

Link Telegram account for notifications.

**Request Body:**
```json
{
  "telegramId": "123456789",
  "authCode": "abc123def"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Telegram account linked successfully"
}
```

**Headers:** `Authorization: Bearer <token>`

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/auth/telegram/link \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"telegramId":"123456789","authCode":"abc123def"}'
```

---

## POST /api/v1/auth/logout

Invalidate current session.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```
