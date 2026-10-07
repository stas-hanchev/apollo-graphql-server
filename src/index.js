import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import {
    GraphQLError,
    NoSchemaIntrospectionCustomRule,
    specifiedRules,
    validate,
} from 'graphql';
import { unwrapResolverError } from '@apollo/server/errors';
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
import { depthLimit } from './utils/depthLimit.js';

const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === 'production';
const validationRules = [depthLimit()];

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

if (process.env.TRUST_PROXY) {
    const trustProxy = Number(process.env.TRUST_PROXY);
    app.set(
        'trust proxy',
        Number.isNaN(trustProxy) ? process.env.TRUST_PROXY : trustProxy
    );
}
const httpServer = createServer(app);

const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
});

const isInternalError = (error) =>
    error.originalError != null && error.extensions?.code == null;

const serverCleanup = useServer(
    {
        schema,
        validate: (schema, document) =>
            validate(schema, document, [
                ...specifiedRules,
                ...validationRules,
                ...(isProduction ? [NoSchemaIntrospectionCustomRule] : []),
            ]),
        onNext: (ctx, id, payload, args, result) => {
            if (!result.errors?.some(isInternalError)) return;

            return {
                ...result,
                errors: result.errors.map((error) => {
                    if (!isInternalError(error)) return error;
                    console.error(error.originalError);

                    return new GraphQLError('Internal server error', {
                        path: error.path,
                        extensions: { code: 'INTERNAL_SERVER_ERROR' },
                    });
                }),
            };
        },
        context: async (ctx) => {
            const authToken = ctx.connectionParams?.authToken;
            return {
                prisma,
                pubsub,
                userId: getOptionalUserId(null, authToken),
            };
        },
    },
    wsServer
);

const formatError = (formattedError, error) => {
    if (formattedError.extensions?.code !== 'INTERNAL_SERVER_ERROR') {
        return formattedError;
    }

    console.error(unwrapResolverError(error));

    return {
        message: 'Internal server error',
        locations: formattedError.locations,
        path: formattedError.path,
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
    };
};

const server = new ApolloServer({
    schema,
    validationRules,
    formatError,
    introspection: !isProduction,
    includeStacktraceInErrorResponses: !isProduction,
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
            ip: req.ip,
            prisma,
            pubsub,
            userId: getOptionalUserId(req),
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
