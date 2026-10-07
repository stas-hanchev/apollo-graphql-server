import { badInput } from '../utils/errors.js';

const MAX_URL_LENGTH = 2048;
const MAX_DESCRIPTION_LENGTH = 500;

const validateUrl = (url) => {
    if (url.length > MAX_URL_LENGTH) {
        throw badInput(`url must be at most ${MAX_URL_LENGTH} characters`);
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
};

const validateDescription = (description) => {
    if (!description.trim()) {
        throw badInput('description must not be empty');
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
        throw badInput(
            `description must be at most ${MAX_DESCRIPTION_LENGTH} characters`
        );
    }
};

export const validateLinkInput = ({ url, description }) => {
    validateDescription(description);
    validateUrl(url);
};

export const validateLinkUpdate = ({ url, description }) => {
    if (url == null && description == null) {
        throw badInput('at least one of url or description must be provided');
    }
    if (description != null) {
        validateDescription(description);
    }
    if (url != null) {
        validateUrl(url);
    }
};

export default validateLinkInput;
