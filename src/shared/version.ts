declare const __HUB_VERSION__: string | undefined;

export const HUB_VERSION: string =
    typeof __HUB_VERSION__ === 'string' && __HUB_VERSION__ ? __HUB_VERSION__ : 'unknown';

export const HUB_VERSION_HEADER = 'x-hub-version';
