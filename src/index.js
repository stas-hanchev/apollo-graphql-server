import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { PubSub } from 'graphql-subscriptions';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/prisma/client.ts';

import 'dotenv/config';
import fs from 'node:fs';

import Query from './resolvers/Query.js';
import Mutation from './resolvers/Mutation.js';
import Subscription from './resolvers/Subscription.js';
import Link from './resolvers/Link.js';
import User from './resolvers/User.js';
import { getOptionalUserId } from './utils/utils.js';

const PORT = process.env.PORT || 4000;

const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
    adapter,
});

const pubsub = new PubSub();

const resolvers = {
    Query,
    Mutation,
    Subscription,
    Link,
    User
};

const schema = makeExecutableSchema({
    typeDefs: fs.readFileSync(
        new URL('./schema.graphql', import.meta.url),
        'utf8'
    ),
    resolvers,
});

const app = express();
const httpServer = createServer(app);

const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
});

const serverCleanup = useServer(
    {
        schema,
        context: async (ctx) => {
            const authToken = ctx.connectionParams?.authToken;
            return {
                prisma,
                pubsub,
                userId: authToken ? getOptionalUserId(null, authToken) : null,
            };
        },
    },
    wsServer
);

const server = new ApolloServer({
    schema,
    plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {
            async serverWillStart() {
                return {
                    async drainServer() {
                        await serverCleanup.dispose();
                    },
                };
            },
        },
    ],
});

await server.start();

app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
        context: async ({ req }) => ({
            ...req,
            prisma,
            pubsub,
            userId: req && req.headers.authorization ? getOptionalUserId(req) : null,
        }),
    })
);

httpServer.on('error', (error) => {
    console.error('Failed to start HTTP server:', error);
    process.exit(1);
});

httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/graphql`);
    console.log(`Subscriptions are running on ws://localhost:${PORT}/graphql`);
});
