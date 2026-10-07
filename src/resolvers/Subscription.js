export default {
    newLink: {
        subscribe: (parent, args, context, info) =>
            context.pubsub.asyncIterableIterator('NEW_LINK'),
        resolve: (payload) => payload,
    },
};
