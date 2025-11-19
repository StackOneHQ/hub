export interface ErrorDetails {
    message: string;
    statusCode: number;
}

export const isErrorsDetails = (error: unknown): error is ErrorDetails => {
    return (error as ErrorDetails).statusCode !== undefined;
};

export interface RequestParams {
    url: string;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
    requestFn?: typeof fetch;
    logger?: Console;
}

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
            headers,
            body: JSON.stringify(body),
        });

        if (isTokenExpired(response)) {
            logger.warn('Token expired');
            return null;
        } else {
            if (!response.ok) {
                const errorResponse = (await response.json()) as ErrorDetails;
                if (errorResponse && isErrorsDetails(errorResponse)) {
                    const { statusCode, ...rest } = errorResponse;
                    throw new Error(
                        JSON.stringify({
                            status: statusCode,
                            ...rest,
                        }),
                    );
                }
            }

            return (await response.json()) as T;
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
