// The "no logo available" mark at stackone-logos.com/api/empty/filled/svg, which the API also
// serves. A data URI, so the fallback itself can never fail to load.
const CONNECTOR_PLACEHOLDER_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="8" fill="#D5D4D2"/><rect x="8" y="8" width="8" height="8" rx="2.667" fill="#A19F9E"/></svg>';

export const CONNECTOR_FALLBACK_LOGO_URL = `data:image/svg+xml,${encodeURIComponent(CONNECTOR_PLACEHOLDER_SVG)}`;
