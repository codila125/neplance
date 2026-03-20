# 🔧 Neplance Server

The Express + MongoDB backend that powers Neplance's secure authentication, job postings, and proposal workflows. It ships with JWT authentication, scoped role checks, and a minimal error layer so client teams can focus on the UX instead of reinventing login flows.

## Why this backend?
- **Opinionated security**: bcrypt password hashing + JWT tokens with configurable secret/expiration cookies.
- **Scalable data layer**: MongoDB via Mongoose with a single entrypoint that can point to local instancedb or Atlas clusters.
- **Clear contracts**: Dedicated routes for auth, proposals, and jobs with strict validation and centralized error handling.

## Stack & tooling
- `Node.js 18+`, Express 4, and MongoDB 8.
- `bcrypt`/`jsonwebtoken` for auth, `cors` + `cookie-parser` already wired for client integration, and `nodemon` for easy local reloads.

## Quick start
1. `cd server` and install packages with `npm install`.
2. Copy the template: `cp .env.example .env`.
3. Edit `.env`:
   - Point `NEPLANCE_MONGODB_URI` to your MongoDB URI (local or Atlas).
   - Choose a `SERVER_PORT` (default 3001) and set `FRONTEND_BASE_URL` to whatever host/front-end origin will consume this API.
   - Generate a long, random value for `AUTH_JWT_SECRET` (e.g., `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`).
   - Set `AUTH_JWT_EXPIRATION` (e.g., `24h`) and `AUTH_JWT_COOKIE_EXPIRATION_DAYS` (e.g., `1`).
   - Set `BLOCKCHAIN_BASE_URL` to your Foedus API base URL (e.g., `http://localhost:3008`).
4. Start the server: `npm start`. You should see `Server listening on 127.0.0.1:<SERVER_PORT>` and `Successfully connected to the Neplance database.` in the logs.

## Environment
```env
NEPLANCE_MONGODB_URI=mongodb://root:password123@localhost:27017/neplance
SERVER_PORT=3001
FRONTEND_BASE_URL=http://localhost:3000
AUTH_JWT_SECRET=<secure 64+ char string>
AUTH_JWT_EXPIRATION=24h
AUTH_JWT_COOKIE_EXPIRATION_DAYS=1
BLOCKCHAIN_BASE_URL=http://localhost:3008
```
- `FRONTEND_BASE_URL` is used by `cors()` so you can match whatever host the client runs on (Next.js dev server, Vercel preview, etc.).
- Keep `AUTH_JWT_SECRET` secret; rotate it before hitting production.
- `BLOCKCHAIN_BASE_URL` is used to create wallet IDs when admin verifies a user.

## Scripts
| Command | Description |
|---------|-------------|
| `npm start` | Starts the server through `nodemon server.js`; hot reloads any backend change. |

## API highlights
- `POST /auth/register`: Create a new user with roles and receive cookies + token.
- `POST /auth/login`: Sign in and get the session cookie + JWT.
- `POST /auth/logout`: Invalidate the cookie instantly.
- `GET /users/:id`, `PUT /users/:id`: User profile access guarded by `protect`/`restrictTo`.
- `/jobs`, `/proposals` routes: typical CRUD plus auth guards for create/update.

## Troubleshooting
- **MongoDB refused connection**: Ensure `NEPLANCE_MONGODB_URI` is reachable and Mongo is running locally. For Atlas, whitelist the current IP.
- **JWT verification errors**: Regenerate the secret, restart the server, and login again from the client so the cookie uses the new secret.
- **CORS blocked**: Confirm `FRONTEND_BASE_URL` matches the origin from which the client is served (include the protocol and port).
- **Port collision**: Run `lsof -ti:<SERVER_PORT> | xargs kill -9` or change `SERVER_PORT`/`NEXT_PUBLIC_API_BASE_URL` accordingly.

## Production notes
- Run behind a reverse proxy and enforce HTTPS when `NODE_ENV=production`. The cookie handler already sets `secure` when detecting production.
- Dockerized deployment only needs to mount `./.env` and ensure the Mongo URI is reachable from the container.

Need a client reference? Check `../client/README.md` for the Next.js setup and the public env var naming.
