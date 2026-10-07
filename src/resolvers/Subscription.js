export default {
    newLink: {
        subscribe: (parent, args, context, info) =>
            context.pubsub.asyncIterableIterator('NEW_LINK'),
        resolve: (payload) => payload,
    },
    updatedLink: {
        subscribe: (parent, args, context, info) =>
            context.pubsub.asyncIterableIterator('LINK_UPDATED'),
        resolve: (payload) => payload,
    },
    deletedLink: {
        subscribe: (parent, args, context, info) =>
            context.pubsub.asyncIterableIterator('LINK_DELETED'),
        resolve: (payload) => payload.id,
    },
};
