export default {
    info: () => `This is the API of a Hackernews Clone`,
    feed: async (parent, args, context) => {
        return await context.prisma.link.findMany();
    }
};
