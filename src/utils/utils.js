import jwt from 'jsonwebtoken';

export const APP_SECRET = process.env.APP_SECRET;

if (!APP_SECRET) {
    throw new Error('APP_SECRET is not set in environment variables');
}

export const getTokenPayload = (token) => jwt.verify(token, APP_SECRET);

export const getUserId = (req, authToken) => {
    if (req) {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            if (!token) {
                throw new Error('No token found');
            }
            const { userId } = getTokenPayload(token);

            return userId;
        }
    } else if (authToken) {
        const { userId } = getTokenPayload(authToken);

        return userId;
    }

    throw new Error('Not authenticated');
};
