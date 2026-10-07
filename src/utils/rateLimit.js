import { tooManyRequests } from './errors.js';

export const createRateLimiter = ({ limit, windowMs, message }) => {
    const hits = new Map();

    const cleanup = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of hits) {
            if (entry.resetAt <= now) hits.delete(key);
        }
    }, windowMs);
    cleanup.unref();

    const getEntry = (key) => {
        const now = Date.now();
        let entry = hits.get(key);
        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + windowMs };
            hits.set(key, entry);
        }

        return entry;
    };

    return {
        check(key) {
            const entry = getEntry(key);
            if (entry.count >= limit) {
                const retryAfter = Math.ceil((entry.resetAt - Date.now()) / 1000);
                throw tooManyRequests(message, retryAfter);
            }
        },
        hit(key) {
            getEntry(key).count += 1;
        },
    };
};

export const loginLimiter = createRateLimiter({
    limit: 10,
    windowMs: 15 * 60 * 1000,
    message: 'Too many login attempts, please try again later',
});

export const signupLimiter = createRateLimiter({
    limit: 5,
    windowMs: 60 * 60 * 1000,
    message: 'Too many sign up attempts, please try again later',
});
