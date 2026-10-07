import { GraphQLError } from 'graphql';

export const badInput = (message) =>
    new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });

export const notFound = (message) =>
    new GraphQLError(message, { extensions: { code: 'NOT_FOUND' } });

export const forbidden = (message) =>
    new GraphQLError(message, { extensions: { code: 'FORBIDDEN' } });
