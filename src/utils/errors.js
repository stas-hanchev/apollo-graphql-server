import { GraphQLError } from 'graphql';

export const badInput = (message) =>
    new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });

export const notFound = (message) =>
    new GraphQLError(message, { extensions: { code: 'NOT_FOUND' } });

export const forbidden = (message) =>
    new GraphQLError(message, { extensions: { code: 'FORBIDDEN' } });

export const unauthenticated = (message = 'Not authenticated') =>
    new GraphQLError(message, { extensions: { code: 'UNAUTHENTICATED' } });

export const tooManyRequests = (message, retryAfterSeconds) =>
    new GraphQLError(message, {
        extensions: { code: 'TOO_MANY_REQUESTS', retryAfter: retryAfterSeconds },
    });

export const requireUserId = (context) => {
    if (!context.userId) {
        throw unauthenticated();
    }

    return context.userId;
};

export const parseId = (id) => {
    const parsed = Number(id);
    if (!Number.isInteger(parsed)) {
        throw badInput('id must be an integer');
    }

    return parsed;
};
