export default {
    links: async (parent, args, context) => {
        return await context.prisma.user
            .findUnique({ where: { id: parent.id } })
            .links();
    },
};
