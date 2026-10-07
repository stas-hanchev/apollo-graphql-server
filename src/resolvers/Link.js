export default {
    createdAt: (parent) => new Date(parent.createdAt).toISOString(),
    postedBy: async (parent, args, context) => {
        return await context.prisma.link
            .findUnique({
                where: {
                    id: parent.id,
                },
            })
            .postedBy();
    },
};
