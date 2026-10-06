import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { GraphQLError } from 'graphql';
import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/prisma/client.ts';
import fs from 'node:fs';

const MAX_URL_LENGTH = 2048;
const MAX_DESCRIPTION_LENGTH = 500;

const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({
    adapter,
});

function badInput(message) {
    return new GraphQLError(message, {
        extensions: { code: 'BAD_USER_INPUT' },
    });
}

function validateLinkInput({ url, description }) {
    if (url.length > MAX_URL_LENGTH) {
        throw badInput(`url must be at most ${MAX_URL_LENGTH} characters`);
    }
    if (!description.trim()) {
        throw badInput('description must not be empty');
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
        throw badInput(
            `description must be at most ${MAX_DESCRIPTION_LENGTH} characters`
        );
    }

    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        throw badInput('url must be a valid absolute URL');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw badInput('url must use http or https');
    }
}

const resolvers = {
    Query: {
        info: () => `This is the API of a Hackernews Clone`,
        feed: async (parent, args, context) => {
            return await context.prisma.link.findMany();
        },
    },
    Mutation: {
        post: (parent, args, context, info) => {
            validateLinkInput(args);
            const newLink = context.prisma.link.create({
                data: {
                    description: args.description,
                    url: args.url,
                },
            });
            return newLink;
        },
    },
};

const server = new ApolloServer({
    typeDefs: fs.readFileSync(
        new URL('./schema.graphql', import.meta.url),
        'utf8'
    ),
    resolvers,
});

startStandaloneServer(server, {
    context: async () => ({ prisma }),
    listen: { port: 4000 },
}).then(({ url }) => console.log(`Server is running on ${url}`));
