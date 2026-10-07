import { badInput } from './errors.js';

export const DEFAULT_TAKE = 10;
export const MAX_TAKE = 50;

export const getPagination = ({ skip, take }) => {
    if (skip != null && (!Number.isInteger(skip) || skip < 0)) {
        throw badInput('skip must be a non-negative integer');
    }
    if (take != null && (!Number.isInteger(take) || take < 1 || take > MAX_TAKE)) {
        throw badInput(`take must be between 1 and ${MAX_TAKE}`);
    }

    return { skip: skip ?? 0, take: take ?? DEFAULT_TAKE };
};
