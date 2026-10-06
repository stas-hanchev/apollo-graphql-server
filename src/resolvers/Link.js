export default {
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
