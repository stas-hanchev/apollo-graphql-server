import { parseId } from '../utils/errors.js';
import { getPagination } from '../utils/pagination.js';

export default {
    info: () => `This is the API of a Hackernews Clone`,
    feed: async (parent, args, context, info) => {
        const { skip, take } = getPagination(args);
        const where = args.filter
            ? {
                  OR: [
                      { description: { contains: args.filter } },
                      { url: { contains: args.filter } },
                  ],
              }
            : {};

        const links = await context.prisma.link.findMany({
            where,
            skip,
            take,
            orderBy: args.orderBy
                ? Object.entries(args.orderBy).map(([field, sort]) => ({
                      [field]: sort,
                  }))
                : undefined,
        });

        const count = await context.prisma.link.count({ where });

        return {
            links,
            count,
        };
    },
    link: (parent, args, context) =>
        context.prisma.link.findUnique({ where: { id: parseId(args.id) } }),
    me: (parent, args, context) =>
        context.userId
            ? context.prisma.user.findUnique({ where: { id: context.userId } })
            : null,
};
