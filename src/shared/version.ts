declare const __HUB_VERSION__: string | undefined;

// `typeof` guard because a build that skips the replace step leaves this undeclared,
// and a bare read would throw a ReferenceError.
export const HUB_VERSION: string =
    typeof __HUB_VERSION__ === 'string' && __HUB_VERSION__ ? __HUB_VERSION__ : 'unknown';

export const HUB_VERSION_HEADER = 'x-hub-version';
