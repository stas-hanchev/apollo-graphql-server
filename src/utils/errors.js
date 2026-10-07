import { GraphQLError } from 'graphql';

export const badInput = (message) =>
    new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });
