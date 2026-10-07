import { getPagination } from '../utils/pagination.js';

export default {
    email: (parent, args, context) =>
        context.userId === parent.id ? parent.email : null,
    links: async (parent, args, context) => {
        const { skip, take } = getPagination(args);

        return await context.prisma.user
            .findUnique({ where: { id: parent.id } })
            .links({ skip, take, orderBy: { createdAt: 'desc' } });
    },
};
