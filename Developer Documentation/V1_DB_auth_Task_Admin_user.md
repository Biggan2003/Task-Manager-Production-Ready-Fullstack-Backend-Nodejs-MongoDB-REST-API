# Task Manager REST API Backend — Developer Documentation

## Version 1 (V1)

**Backend:** Node.js + Express.js + MongoDB + Mongoose
**API:** REST
**Authentication:** JWT Access Token + Database-backed Refresh Token
**Current Status:** Backend V1 Core Complete — ready for frontend development

---

## 1. Project Overview

This backend provides a REST API for a Task Manager application.

### Implemented

- User registration
- User login
- JWT access-token authentication
- Database-backed refresh tokens
- Refresh-token hashing
- Refresh-token rotation
- Refresh-token revocation
- Refresh-token reuse detection
- Logout
- Current-user endpoint
- User-owned Task CRUD
- Admin role-based authorization
- Admin user management
- Admin task management
- Health check
- MongoDB persistence

---

## 2. Main Architecture

```text
                         CLIENT
                  Postman / Frontend
                           |
                           v
                   Express REST API
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
     Auth Routes       Task Routes      Admin Routes
          |                |                |
          v                v                v
     Controllers       Controllers      Controllers
          |                |                |
          +----------------+----------------+
                           |
                           v
                       Middleware
              Authentication / Authorization
                           |
                           v
                         Models
                 +---------+---------+
                 |         |         |
                 v         v         v
               User      Task   RefreshToken
                 |         |         |
                 +---------+---------+
                           |
                           v
                     Mongoose ODM
                           |
                           v
                      MongoDB Atlas
```

---

## 3. Request Flow

### Protected user request

```text
Client
  |
  v
Express Route
  |
  v
authenticateUser
  |
  v
Controller
  |
  v
Mongoose Model
  |
  v
MongoDB
  |
  v
JSON Response
```

### Protected admin request

```text
Client
  |
  v
authenticateUser
  |
  v
authorizeAdmin
  |
  v
Admin Controller
  |
  v
MongoDB
```

---

## 4. Current Folder Structure

```text
project-root/
|
+-- src/
|   |
|   +-- controllers/
|   |   +-- authController.js
|   |   +-- taskController.js
|   |   +-- adminController.js
|   |
|   +-- middleware/
|   |   +-- authMiddleware.js
|   |   +-- adminMiddleware.js
|   |
|   +-- models/
|   |   +-- User.js
|   |   +-- Task.js
|   |   +-- RefreshToken.js
|   |
|   +-- routes/
|   |   +-- authRoutes.js
|   |   +-- taskRoutes.js
|   |   +-- adminRoutes.js
|   |
|   +-- utils/
|   |   +-- jwt.js
|   |
|   +-- app.js
|   +-- server.js
|
+-- Developer Documentation/
|   +-- VERSION-1.md
|
+-- .env
+-- package.json
+-- package-lock.json
```

> Additional project files may exist; this document records the V1 application structure and workflow established during development.

---

## 5. Application Entry Points

### `src/server.js`

Responsible for:

- Loading environment configuration
- Connecting to MongoDB
- Starting the HTTP server

Current development server:

```text
http://localhost:3005
```

### `src/app.js`

Mounts:

```text
/api/auth
/api/tasks
/api/admin
```

The health endpoint is:

```text
GET /health
```

Expected:

```json
{
  "status": "ok",
  "database": "connected"
}
```

---

# 6. Authentication Architecture

## Access Token

Access tokens are JWTs.

Current payload:

```json
{
  "userId": "USER_ID",
  "role": "user"
}
```

Current lifetime:

```text
1 hour
```

Protected requests use:

```text
Authorization: Bearer <ACCESS_TOKEN>
```

---

## Refresh Token

Refresh tokens are currently **random cryptographic tokens, not JWTs**.

Generated using:

```text
crypto.randomBytes(64)
```

The raw token is returned to the client.

Only its SHA-256 hash is stored in MongoDB.

```text
Raw Refresh Token
       |
       v
   SHA-256 Hash
       |
       v
   MongoDB
```

---

# 7. RefreshToken Model

File:

```text
src/models/RefreshToken.js
```

Fields:

```text
user
tokenHash
expiresAt
revokedAt
lastUsedAt
familyId
createdAt
updatedAt
```

### Purpose

- `user` — owner of the refresh session
- `tokenHash` — hashed token; raw token is not stored
- `expiresAt` — refresh-session expiry
- `revokedAt` — logout/rotation revocation timestamp
- `lastUsedAt` — last refresh usage
- `familyId` — groups tokens from the same login/session family

Current refresh-token lifetime:

```text
10 days
```

---

# 8. Login Flow

Endpoint:

```text
POST /api/auth/login
```

Flow:

```text
Email + Password
       |
       v
Find User
       |
       v
bcrypt.compare()
       |
       v
Generate Access Token
       |
       v
Generate Random Refresh Token
       |
       v
Hash Refresh Token
       |
       v
Create RefreshToken DB Record
       |
       v
Return Access Token + Refresh Token + User
```

Response contains:

```text
accessToken
refreshToken
user
```

---

# 9. Refresh Flow

Endpoint:

```text
POST /api/auth/refresh
```

Request:

```json
{
  "refreshToken": "RAW_REFRESH_TOKEN"
}
```

Flow:

```text
Raw Refresh Token
       |
       v
SHA-256 Hash
       |
       v
Find RefreshToken record
       |
       +---- Not found ----> 401
       |
       v
Check revokedAt
       |
       +---- Revoked ----> Reuse Detection
       |
       v
Check expiresAt
       |
       +---- Expired ----> 401
       |
       v
Find User
       |
       v
Revoke Old Refresh Token
       |
       v
Generate New Access Token
       |
       v
Generate New Refresh Token
       |
       v
Store New RefreshToken record
       |
       v
Return New Access + Refresh Token
```

This is **refresh-token rotation**.

Important:

```text
Old refresh token -> revoked
New refresh token -> active
```

The frontend must replace its stored refresh token with the newest one returned by `/refresh`.

---

# 10. Refresh-Token Reuse Detection

If a revoked refresh token is used again:

```text
Old Token
   |
   v
Database lookup
   |
   v
revokedAt != null
   |
   v
Reuse detected
   |
   v
Revoke remaining active tokens
in the same family
   |
   v
401
```

Current response:

```json
{
  "message": "Refresh token reuse detected"
}
```

This protects against reuse of an old/stolen refresh token.

---

# 11. Logout

Endpoint:

```text
POST /api/auth/logout
```

Request:

```json
{
  "refreshToken": "RAW_REFRESH_TOKEN"
}
```

Flow:

```text
Refresh Token
      |
      v
Hash Token
      |
      v
Find DB Session
      |
      v
Set revokedAt
      |
      v
Save MongoDB
      |
      v
Logout successful
```

After logout, using the same refresh token for `/refresh` should fail.

---

# 12. Current User

Endpoint:

```text
GET /api/auth/me
```

Flow:

```text
Access Token
     |
     v
authenticateUser
     |
     v
req.user.userId
     |
     v
Find User
     |
     v
Return User
```

Password is excluded from the response.

---

# 13. Task Ownership

Each Task stores:

```text
Task.user -> User._id
```

Normal task controllers query using both task ID and the authenticated user's ID where appropriate.

Therefore:

```text
User A -> own tasks only
User B -> own tasks only
Admin  -> admin endpoints
```

---

# 14. Task CRUD APIs

## Create

```text
POST /api/tasks
```

Example:

```json
{
  "title": "Learn MongoDB",
  "done": false
}
```

Owner is automatically assigned from:

```text
req.user.userId
```

## Get My Tasks

```text
GET /api/tasks
```

Returns only the authenticated user's tasks.

Newest tasks are returned first.

## Get Task

```text
GET /api/tasks/:id
```

Checks task ownership.

## Update Task

```text
PUT /api/tasks/:id
```

Example:

```json
{
  "title": "Learn MongoDB deeply",
  "done": true
}
```

## Delete Task

```text
DELETE /api/tasks/:id
```

Checks task ownership before deletion.

---

# 15. Admin Architecture

Admin requests use:

```text
authenticateUser
        |
        v
authorizeAdmin
        |
        v
Admin Controller
```

Authorization:

```text
Unauthenticated -> 401
Authenticated non-admin -> 403
Admin -> allowed
```

Roles currently used:

```text
user
admin
```

There is no separate admin registration flow. An existing user can be promoted through the admin role-management endpoint.

---

# 16. Admin APIs

```text
GET    /api/admin/users
GET    /api/admin/tasks
GET    /api/admin/users/:userId/tasks
GET    /api/admin/users/:id
PATCH  /api/admin/users/:id/role
DELETE /api/admin/users/:id
```

### Admin capabilities

- View all users
- View all tasks
- View a specific user's tasks
- View a user's details
- Change user role
- Delete a user
- Delete associated tasks when deleting a user

---

# 17. Complete V1 API List

**Base URL:** `http://localhost:3005`

| # | Method | Full API Path | Access | Purpose |
|---|---|---|---|---|
| 1 | POST | `http://localhost:3005/api/auth/register` | Public | নতুন user register করা |
| 2 | POST | `http://localhost:3005/api/auth/login` | Public | Login করে access + refresh token নেওয়া |
| 3 | POST | `http://localhost:3005/api/auth/refresh` | Refresh Token | Expired access token-এর বদলে নতুন access + refresh token নেওয়া |
| 4 | POST | `http://localhost:3005/api/auth/logout` | Refresh Token | Refresh token revoke করে logout করা |
| 5 | GET | `http://localhost:3005/api/auth/me` | Authenticated | Current logged-in user-এর details পাওয়া |
| 6 | GET | `http://localhost:3005/api/tasks` | User | নিজের সব tasks পাওয়া |
| 7 | POST | `http://localhost:3005/api/tasks` | User | নতুন task তৈরি করা |
| 8 | GET | `http://localhost:3005/api/tasks/:id` | User | নির্দিষ্ট task-এর details পাওয়া |
| 9 | PUT | `http://localhost:3005/api/tasks/:id` | User | নির্দিষ্ট task update করা |
| 10 | DELETE | `http://localhost:3005/api/tasks/:id` | User | নির্দিষ্ট task delete করা |
| 11 | GET | `http://localhost:3005/api/admin/users` | Admin | সব users দেখা |
| 12 | GET | `http://localhost:3005/api/admin/tasks` | Admin | সব users-এর সব tasks দেখা |
| 13 | GET | `http://localhost:3005/api/admin/users/:userId/tasks` | Admin | নির্দিষ্ট user-এর tasks দেখা |
| 14 | GET | `http://localhost:3005/api/admin/users/:id` | Admin | নির্দিষ্ট user-এর details দেখা |
| 15 | PATCH | `http://localhost:3005/api/admin/users/:id/role` | Admin | User-এর role পরিবর্তন করা |
| 16 | DELETE | `http://localhost:3005/api/admin/users/:id` | Admin | User এবং তার associated tasks delete করা |
| 17 | GET | `http://localhost:3005/health` | Public | Server ও MongoDB connection health check করা |

### Summary

| Category | Count |
|---|---:|
| Authentication | 5 |
| Task Management | 5 |
| Admin Management | 6 |
| Health Check | 1 |
| **Total** | **17** |

# 18. Middleware

## `src/middleware/authMiddleware.js`

Purpose:

```text
Authorization header
       |
       v
Extract Bearer token
       |
       v
Verify Access JWT
       |
       v
req.user
```

Expected header:

```text
Authorization: Bearer <ACCESS_TOKEN>
```

## `src/middleware/adminMiddleware.js`

Checks:

```text
req.user.role === "admin"
```

Non-admin users receive:

```text
403 Forbidden
```

---

# 19. Security Already Implemented

Current V1 includes:

- bcrypt password hashing
- JWT access-token authentication
- Cryptographically random refresh tokens
- SHA-256 refresh-token hashing
- Database-backed refresh sessions
- Refresh-token expiry
- Refresh-token rotation
- Refresh-token revocation
- Refresh-token reuse detection
- Role-based admin authorization
- Password exclusion from responses
- Task ownership checks
- Environment-based secrets
- Health check

---

# 20. How to Run

From the project root:

```bash
npm install
```

Create/configure:

```text
.env
```

Required configuration includes:

```env
PORT=3005
MONGODB_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_access_token_secret
```

Use the exact variable names required by the current source code.

Never commit real `.env` secrets.

Start development server using the project's configured script, for example:

```bash
npm run dev
```

or:

```bash
node src/server.js
```

Development URL:

```text
http://localhost:3005
```

---

# 21. Basic Verification

## Health

```text
GET http://localhost:3005/health
```

Expected:

```json
{
  "status": "ok",
  "database": "connected"
}
```

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

## Tasks

```text
POST   /api/tasks
GET    /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
```

## Admin

```text
GET    /api/admin/users
GET    /api/admin/tasks
GET    /api/admin/users/:userId/tasks
GET    /api/admin/users/:id
PATCH  /api/admin/users/:id/role
DELETE /api/admin/users/:id
```

---

# 22. Recommended Testing Sequence

Whenever authentication code changes, test:

```text
Register
  |
  v
Login
  |
  v
Access protected API
  |
  v
Refresh
  |
  v
Use NEW refresh token
  |
  v
Logout
  |
  v
Try revoked token
  |
  v
Verify rejection
```

Also test:

```text
User -> cannot access another user's task
User -> cannot access admin API
Admin -> can access admin API
```

---

# 23. Current V1 Status

```text
Backend Core
    |
    +-- Express Server             ✅
    +-- MongoDB                    ✅
    +-- Registration               ✅
    +-- Login                      ✅
    +-- Access Token               ✅
    +-- Refresh Token              ✅
    +-- Refresh Token DB Storage   ✅
    +-- Token Rotation             ✅
    +-- Token Revocation           ✅
    +-- Reuse Detection            ✅
    +-- Logout                     ✅
    +-- /auth/me                   ✅
    +-- Task CRUD                  ✅
    +-- Task Ownership             ✅
    +-- Admin RBAC                 ✅
    +-- Admin User Management      ✅
    +-- Admin Task Management      ✅
    +-- Health Check               ✅
    +-- Postman Verification       ✅
```

## V1 Core Backend: READY FOR FRONTEND DEVELOPMENT

---

# 24. Pending Production Hardening

These do not block frontend development but should be completed before final production deployment.

## Security

- [ ] Centralized error-handling middleware
- [ ] Request/schema validation
- [ ] Helmet/security headers
- [ ] Production CORS configuration
- [ ] Rate limiting
- [ ] Login brute-force protection
- [ ] Request size limits
- [ ] Strong password policy
- [ ] Secure HttpOnly cookie strategy if refresh tokens move to cookies
- [ ] CSRF protection when cookie-based authentication is used

## Refresh Token

- [ ] Atomic/transaction-safe rotation
- [ ] Session/device management
- [ ] Expired-token cleanup
- [ ] MongoDB TTL strategy for expired sessions

## API Quality

- [ ] Consistent response format
- [ ] Pagination
- [ ] Filtering/search
- [ ] Configurable sorting
- [ ] Query/index optimization
- [ ] ObjectId validation

## Observability

- [ ] Structured logging
- [ ] Request/correlation ID
- [ ] Production error logging
- [ ] Readiness/liveness endpoints
- [ ] Monitoring and alerting

## Testing

- [ ] Unit tests
- [ ] Integration tests
- [ ] Authentication tests
- [ ] Authorization tests
- [ ] Refresh rotation tests
- [ ] Reuse detection tests
- [ ] Admin security tests
- [ ] Task ownership tests
- [ ] Negative/edge-case tests

## Documentation

- [ ] OpenAPI/Swagger
- [ ] Full request/response examples
- [ ] Environment variable reference
- [ ] Deployment guide
- [ ] Final architecture diagrams

## Deployment

- [ ] Production environment configuration
- [ ] Docker
- [ ] CI/CD
- [ ] HTTPS
- [ ] Reverse proxy/domain
- [ ] Monitoring
- [ ] Backup/recovery strategy

---

# 25. Frontend Development Plan

Frontend can start now.

Recommended order:

```text
Backend V1
    |
    v
Frontend Setup
    |
    v
Authentication
    |
    +-- Register
    +-- Login
    +-- Logout
    |
    v
User Dashboard
    |
    +-- Task List
    +-- Create
    +-- Update
    +-- Delete
    +-- Details
    |
    v
Admin Dashboard
    |
    +-- Users
    +-- Tasks
    +-- User Details
    +-- Role Management
    +-- Delete User
    |
    v
Integration Testing
    |
    v
Backend Hardening
    |
    v
Production Deployment
```

---

# 26. Important Notes for Future Developers / LLMs

1. This project already has a functional REST API backend.
2. Do not rebuild authentication from scratch.
3. Access tokens are JWTs.
4. Refresh tokens are random cryptographic tokens, not JWTs.
5. Only hashed refresh tokens are stored in MongoDB.
6. Refresh sessions are stored in the `RefreshToken` model.
7. Refresh-token rotation is enabled.
8. The previous refresh token becomes revoked after successful rotation.
9. Reuse of a revoked refresh token triggers token-family revocation.
10. Logout revokes the refresh session server-side.
11. Task ownership is based on the authenticated user's ID.
12. Admin access is based on the user's `role`.
13. `/api/auth/me` returns current user information from MongoDB.
14. Protected frontend requests use `Authorization: Bearer <ACCESS_TOKEN>`.
15. The newest refresh token returned by `/refresh` must replace the previous one.
16. `.env` contains secrets and must not be committed.
17. Authentication changes must be tested through the full token lifecycle.
18. Remaining hardening should be incremental; do not rewrite working V1 functionality without a reason.

---

# 27. Milestone

```text
              TASK MANAGER BACKEND V1

                     COMPLETE
                        |
        +---------------+---------------+
        |               |               |
        v               v               v
      AUTH            TASKS           ADMIN
        ✅               ✅               ✅
        |               |               |
        +---------------+---------------+
                        |
                        v
                  MongoDB Atlas
                        |
                        v
                   REST API V1
                        |
                        v
              FRONTEND DEVELOPMENT
                    NEXT STEP
```

**Current milestone:** Backend V1 Core Complete
**Next milestone:** Frontend V1
**Final milestone:** Production hardening + deployment
