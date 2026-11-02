import { HUB_VERSION, HUB_VERSION_HEADER } from './version';

/** A request the API answered with an error: its status, its message, and anything else it sent. */
export class HubRequestError extends Error {
    readonly status: number;
    readonly details: Record<string, unknown>;

    constructor(status: number, message: string, details: Record<string, unknown> = {}) {
        super(message);
        this.name = 'HubRequestError';
        this.status = status;
        this.details = details;
    }
}

const parseJson = (text: string): unknown => {
    try {
        return JSON.parse(text);
    } catch {
        return undefined;
    }
};

// Validation errors answer with a list of messages rather than one.
const messageText = (message: unknown): string => {
    if (Array.isArray(message)) {
        return message.join(', ');
    }
    return typeof message === 'string' ? message : '';
};

// Any error answer, including a gateway's own body or an HTML page, keeps the status it came with.
const errorFromResponse = async (response: Response): Promise<HubRequestError> => {
    const body = parseJson(await response.text());
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return new HubRequestError(response.status, '');
    }
    const { statusCode: _statusCode, message, ...rest } = body as Record<string, unknown>;
    return new HubRequestError(response.status, messageText(message), rest);
};

export interface RequestParams {
    url: string;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
    requestFn?: typeof fetch;
    logger?: Console;
}

const withHubVersion = (headers?: Record<string, string>): Record<string, string> => {
    const merged: Record<string, string> = {};

    for (const [name, value] of Object.entries(headers ?? {})) {
        if (name.toLowerCase() !== HUB_VERSION_HEADER.toLowerCase()) {
            merged[name] = value;
        }
    }

    merged[HUB_VERSION_HEADER] = HUB_VERSION;

    return merged;
};

const isTokenExpired = (response: Response): boolean => {
    if (response?.status === 401 || response?.status === 403) {
        return true;
    }
    return false;
};

export async function request<T>({
    url,
    body,
    headers,
    method,
    requestFn = fetch,
    logger = console,
}: RequestParams & { method: 'PATCH' | 'POST' | 'DELETE' | 'GET' }): Promise<T | null> {
    try {
        const response = await requestFn(url, {
            method,
            headers: withHubVersion(headers),
            body: JSON.stringify(body),
        });

        if (isTokenExpired(response)) {
            logger.warn('Token expired');
            return null;
        } else {
            if (!response.ok) {
                throw await errorFromResponse(response);
            }

            const text = await response.text();
            if (!text) return null;
            return JSON.parse(text) as T;
        }
    } catch (error) {
        logger.error(`Error making request to ${url}`, error);

        throw error;
    }
}

export async function postRequest<T>(params: RequestParams): Promise<T | null> {
    return request<T>({ ...params, method: 'POST' });
}

export async function patchRequest<T>(params: RequestParams): Promise<T | null> {
    return request<T>({ ...params, method: 'PATCH' });
}

export async function deleteRequest<T>(params: RequestParams): Promise<T | null> {
    return request<T>({ ...params, method: 'DELETE' });
}

export async function getRequest<T>(params: RequestParams): Promise<T | null> {
    return request<T>({ ...params, method: 'GET' });
}
