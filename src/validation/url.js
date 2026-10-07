import { badInput } from '../utils/errors.js';

const MAX_URL_LENGTH = 2048;
const MAX_DESCRIPTION_LENGTH = 500;

export const validateLinkInput = ({ url, description }) => {
    if (url.length > MAX_URL_LENGTH) {
        throw badInput(`url must be at most ${MAX_URL_LENGTH} characters`);
    }
    if (!description.trim()) {
        throw badInput('description must not be empty');
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
        throw badInput(
            `description must be at most ${MAX_DESCRIPTION_LENGTH} characters`
        );
    }

    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        throw badInput('url must be a valid absolute URL');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw badInput('url must use http or https');
    }
}

export default validateLinkInput;
