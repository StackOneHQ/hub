export const isFalconVersion = (version: string) => {
    return version != null && version != '1' && version != '2';
};

/**
 * Detects if the Hub is embedded in the auth link page (e.g., /hub/embedded).
 * When embedded in this context, certain UI elements like the Close button
 * should be hidden since they don't function properly.
 */
export const isEmbeddedInAuthLink = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.location.pathname.includes('/hub/embedded');
};
