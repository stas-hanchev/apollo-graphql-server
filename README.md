# Apollo GraphQL Server

GraphQL API (Apollo Server 5 + Express 5 + Prisma 7 / SQLite) with JWT authentication and WebSocket subscriptions.

**Requirements:** Node.js >= 22.18

## Local setup

```bash
git clone https://github.com/stas-hanchev/apollo-graphql-server.git
cd apollo-graphql-server
npm install
cp .env.example .env          # PowerShell: Copy-Item .env.example .env
npx prisma migrate dev        # creates dev.db and applies migrations
npm run build                 # prisma generate
npm run dev                   # http://localhost:4000/graphql
```

## Environment variables (`.env`)

```env
DATABASE_URL="file:./dev.db"
APP_SECRET="change-me"
PORT=4000
JWT_EXPIRES_IN="7d"   # token lifetime, default 7d
# TRUST_PROXY=1       # behind a reverse proxy: lets rate limiting see real client IPs
```

## Scripts

```bash
npm run dev          # start with auto-reload
npm start            # start
npm run build        # generate Prisma Client
npm run start:prod   # apply migrations + start with NODE_ENV=production
npm run studio       # Prisma Studio (database browser)
```

## Deployment

```bash
git clone https://github.com/stas-hanchev/apollo-graphql-server.git
cd apollo-graphql-server
npm ci
cp .env.example .env          # set your own APP_SECRET
npm run build
npm run start:prod
```

Run in the background with PM2:

```bash
npm install -g pm2
pm2 start npm --name apollo-graphql-server -- run start:prod
pm2 save && pm2 startup
```

## Endpoints

- HTTP: `http://localhost:4000/graphql`
- WebSocket (subscriptions): `ws://localhost:4000/graphql`

Authorization: `Authorization: Bearer <token>` header (for WS — `connectionParams.authToken`).
Tokens expire after `JWT_EXPIRES_IN`; an invalid or expired token is treated as anonymous (`me` returns `null`).

## API limits and errors

- `feed` / `User.links`: `skip >= 0`, `take` 1–50 (default 10).
- Query depth is limited to 6 levels (introspection fields are not counted).
- `login`: 10 failed attempts per IP per 15 minutes; `signup`: 5 per IP per hour.
- `User.email` is visible only to the user themselves (`null` for others).
- Error codes in `extensions.code`: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_USER_INPUT`,
  `TOO_MANY_REQUESTS` (with `retryAfter` seconds), `GRAPHQL_VALIDATION_FAILED`.
  Unexpected errors are logged on the server and returned as `INTERNAL_SERVER_ERROR` / "Internal server error".
- With `NODE_ENV=production` (`npm run start:prod`) introspection and stack traces are disabled.

## Example operations

```graphql
mutation { signup(name: "Alice", email: "alice@example.com", password: "secret") { token } }
mutation { login(email: "alice@example.com", password: "secret") { token } }
mutation { post(url: "https://graphql.org", description: "GraphQL") { id } }
mutation { updateLink(id: 1, description: "GraphQL docs") { id url description } }   # author only
mutation { deleteLink(id: 1) { id } }                                                  # author only
query    { feed(filter: "graphql", skip: 0, take: 10, orderBy: { createdAt: desc }) { count links { id url } } }
query    { link(id: 1) { id url description postedBy { id name } } }
query    { me { id name email } }                                                     # null when not authenticated
subscription { newLink { id url description } }
subscription { updatedLink { id url description } }
subscription { deletedLink }                                                           # returns the deleted link id
```
