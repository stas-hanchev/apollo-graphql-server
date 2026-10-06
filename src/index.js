import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/prisma/client.ts';

import 'dotenv/config';
import fs from 'node:fs';

import Query from './resolvers/Query.js';
import Mutation from './resolvers/Mutation.js';
import Link from './resolvers/Link.js';
import User from './resolvers/User.js';
import { getUserId } from './utils/utils.js';

const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
    adapter,
});

const resolvers = {
    Query,
    Mutation,
    Link,
    User
};

const server = new ApolloServer({
    typeDefs: fs.readFileSync(
        new URL('./schema.graphql', import.meta.url),
        'utf8'
    ),
    resolvers,
});

startStandaloneServer(server, {
    context: async ({ req }) => ({
        ...req,
        prisma,
        userId: req && req.headers.authorization ? getUserId(req) : null,
    }),
    listen: { port: 4000 },
}).then(({ url }) => console.log(`Server is running on ${url}`));
