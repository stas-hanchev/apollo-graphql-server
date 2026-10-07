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
```

## Scripts

```bash
npm run dev          # start with auto-reload
npm start            # start
npm run build        # generate Prisma Client
npm run start:prod   # apply migrations + start
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

## Example operations

```graphql
mutation { signup(name: "Alice", email: "alice@example.com", password: "secret") { token } }
mutation { login(email: "alice@example.com", password: "secret") { token } }
mutation { post(url: "https://graphql.org", description: "GraphQL") { id } }
mutation { updateLink(id: 1, description: "GraphQL docs") { id url description } }   # author only
mutation { deleteLink(id: 1) { id } }                                                  # author only
query    { feed(filter: "graphql", skip: 0, take: 10, orderBy: { createdAt: desc }) { count links { id url } } }
subscription { newLink { id url description } }
subscription { updatedLink { id url description } }
subscription { deletedLink }                                                           # returns the deleted link id
```
