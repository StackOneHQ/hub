import { HubRequestError } from '../../../shared/httpClient';

export const LOAD_ERROR_TITLE = "Couldn't load integrations";
export const LOAD_ERROR_FALLBACK = 'Check your connection and try again.';
export const CONNECT_ERROR_FALLBACK = 'An unexpected error occurred';
export const PROVIDER_RESPONSE_FALLBACK = 'Please try again later';

export const errorStatus = (error: unknown): number | undefined =>
    error instanceof HubRequestError ? error.status : undefined;

export interface LoadErrorDescription {
    title: string;
    message: string;
    retryable: boolean;
}

/**
 * What the hub says when it cannot load what it needs to open. A server error or a failed
 * request can pass on a second try; a 4xx answer will not, so it gets no retry.
 */
export const describeLoadError = (error: unknown): LoadErrorDescription => {
    if (error instanceof HubRequestError) {
        return {
            title: LOAD_ERROR_TITLE,
            message: error.message || LOAD_ERROR_FALLBACK,
            retryable: error.status >= 500,
        };
    }

    return { title: LOAD_ERROR_TITLE, message: LOAD_ERROR_FALLBACK, retryable: true };
};

export interface ConnectErrorDescription {
    message: string;
    provider_response: string;
}

const asText = (value: unknown): string | undefined =>
    typeof value === 'string' && value.length > 0 ? value : undefined;

// Some connect failures carry the provider's answer as JSON inside the message itself.
const parseNestedError = (message: string): Record<string, unknown> | undefined => {
    try {
        const parsed: unknown = JSON.parse(message);
        return parsed !== null && typeof parsed === 'object'
            ? (parsed as Record<string, unknown>)
            : undefined;
    } catch {
        return undefined;
    }
};

export const describeConnectError = (error: unknown): ConnectErrorDescription => {
    if (!(error instanceof HubRequestError)) {
        return {
            message: asText((error as Error | undefined)?.message) ?? CONNECT_ERROR_FALLBACK,
            provider_response: PROVIDER_RESPONSE_FALLBACK,
        };
    }

    const nested = parseNestedError(error.message);
    const source = nested ?? { message: error.message, ...error.details };

    return {
        message: asText(source.message) ?? CONNECT_ERROR_FALLBACK,
        provider_response: asText(source.provider_response) ?? PROVIDER_RESPONSE_FALLBACK,
    };
};
