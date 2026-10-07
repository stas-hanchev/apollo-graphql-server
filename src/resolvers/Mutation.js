import bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';
import validateLinkInput from '../validation/url.js';
import { APP_SECRET } from '../utils/utils.js';

export default {
    signup: async (parent, args, context, info) => {
        const password = await bcrypt.hash(args.password, 10);
        let user;
        try {
            user = await context.prisma.user.create({
                data: { ...args, password },
            });
        } catch (error) {
            if (error.code === 'P2002') {
                throw new GraphQLError('User with this email already exists', {
                    extensions: { code: 'BAD_USER_INPUT' },
                });
            }
            throw error;
        }
        const token = jwt.sign({ userId: user.id }, APP_SECRET);

        return {
            token,
            user,
        };
    },

    login: async (parent, args, context, info) => {
        const user = await context.prisma.user.findUnique({
            where: { email: args.email },
        });
        if (!user) {
            throw new Error('No such user found');
        }

        const valid = await bcrypt.compare(args.password, user.password);
        if (!valid) {
            throw new Error('Invalid password');
        }

        const token = jwt.sign({ userId: user.id }, APP_SECRET);

        return {
            token,
            user,
        };
    },

    post: async (parent, args, context, info) => {
        validateLinkInput(args);
        const { userId } = context;
        if (!userId) {
            throw new Error('Not authenticated');
        }

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
};
