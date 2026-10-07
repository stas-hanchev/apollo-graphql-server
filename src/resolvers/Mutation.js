import bcrypt from 'bcryptjs';
import validateLinkInput, { validateLinkUpdate } from '../validation/url.js';
import { createToken } from '../utils/utils.js';
import {
    badInput,
    forbidden,
    notFound,
    parseId,
    requireUserId,
} from '../utils/errors.js';
import { loginLimiter, signupLimiter } from '../utils/rateLimit.js';

const INVALID_CREDENTIALS = 'Invalid email or password';

const findOwnLink = async (id, context) => {
    const userId = requireUserId(context);
    const linkId = parseId(id);

    const link = await context.prisma.link.findUnique({
        where: { id: linkId },
    });
    if (!link) {
        throw notFound('Link not found');
    }
    if (link.postedById !== userId) {
        throw forbidden('You can only modify your own links');
    }

    return link;
};

export default {
    signup: async (parent, args, context, info) => {
        const limitKey = context.ip;
        signupLimiter.check(limitKey);
        signupLimiter.hit(limitKey);

        const password = await bcrypt.hash(args.password, 10);
        let user;
        try {
            user = await context.prisma.user.create({
                data: { ...args, password },
            });
        } catch (error) {
            if (error.code === 'P2002') {
                throw badInput('User with this email already exists');
            }
            throw error;
        }
        context.userId = user.id;

        return {
            token: createToken(user.id),
            user,
        };
    },

    login: async (parent, args, context, info) => {
        const limitKey = context.ip;
        loginLimiter.check(limitKey);

        const user = await context.prisma.user.findUnique({
            where: { email: args.email },
        });
        const valid =
            user != null && (await bcrypt.compare(args.password, user.password));
        if (!valid) {
            loginLimiter.hit(limitKey);
            throw badInput(INVALID_CREDENTIALS);
        }

        context.userId = user.id;

        return {
            token: createToken(user.id),
            user,
        };
    },

    post: async (parent, args, context, info) => {
        const userId = requireUserId(context);
        validateLinkInput(args);

        const newLink = await context.prisma.link.create({
            data: {
                url: args.url,
                description: args.description,
                postedBy: { connect: { id: userId } },
            },
        });
        context.pubsub.publish('NEW_LINK', newLink);

        return newLink;
    },

    updateLink: async (parent, args, context, info) => {
        const { id, url, description } = args;
        validateLinkUpdate({ url, description });
        const link = await findOwnLink(id, context);

        const updatedLink = await context.prisma.link.update({
            where: { id: link.id },
            data: {
                ...(url != null && { url }),
                ...(description != null && { description }),
            },
        });
        context.pubsub.publish('LINK_UPDATED', updatedLink);

        return updatedLink;
    },

    deleteLink: async (parent, args, context, info) => {
        const link = await findOwnLink(args.id, context);

        const deletedLink = await context.prisma.link.delete({
            where: { id: link.id },
        });
        context.pubsub.publish('LINK_DELETED', deletedLink);

        return deletedLink;
    },
};
