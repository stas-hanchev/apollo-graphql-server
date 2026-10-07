import jwt from 'jsonwebtoken';

export const APP_SECRET = process.env.APP_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!APP_SECRET) {
    throw new Error('APP_SECRET is not set in environment variables');
}

export const createToken = (userId) =>
    jwt.sign({ userId }, APP_SECRET, {
        algorithm: 'HS256',
        expiresIn: JWT_EXPIRES_IN,
    });

export const getTokenPayload = (token) =>
    jwt.verify(token, APP_SECRET, { algorithms: ['HS256'] });

const getTokenFromHeader = (authHeader) => {
    const [scheme, token] = authHeader.split(' ');

    return scheme === 'Bearer' && token ? token : null;
};


export const getOptionalUserId = (req, authToken) => {
    const token = req?.headers.authorization
        ? getTokenFromHeader(req.headers.authorization)
        : authToken;
    if (!token) {
        return null;
    }

    try {
        const { userId } = getTokenPayload(token);

        return Number.isInteger(userId) ? userId : null;
    } catch {
        return null;
    }
};
