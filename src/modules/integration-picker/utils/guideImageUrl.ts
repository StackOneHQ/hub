const STACKONE_DOCS_BASE_URL = 'https://docs.stackone.com';

const ABSOLUTE_URL = /^https?:\/\//i;
const LEADING_SEPARATORS = /^(?:\.?\/)+/;

/**
 * Guide image sources are authored relative to the connector's page on the docs site, which
 * is where the screenshots are published, so the hub has to rebuild the URL the docs site
 * resolves them to. Pure string work, because this runs during render and the bundle is
 * consumed by server-rendered frameworks.
 */
export const guideImageUrl = (connectorKey: string, src: string): string | undefined => {
    const trimmed = src.trim();

    if (trimmed.length === 0 || connectorKey.length === 0) {
        return undefined;
    }

    if (ABSOLUTE_URL.test(trimmed)) {
        return trimmed;
    }

    return `${STACKONE_DOCS_BASE_URL}/connectors/${connectorKey}/${trimmed.replace(LEADING_SEPARATORS, '')}`;
};
