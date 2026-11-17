import { FeatureFlag } from '../../../shared/types/featureFlags';
import { Guide } from '../types';
import { guidePages } from './guidePages';

/** Puts the account linking guide beside the credential fields, per organization. */
export const CONNECTION_GUIDE_FLAG: FeatureFlag = 'hub_connection_guide_release';

/**
 * Whether the header keeps its link to the published guide while the same guide is on screen.
 * Off, the inline guide replaces the link; connectors without one keep it either way.
 */
export const KEEP_GUIDE_LINK_WITH_INLINE_GUIDE = false;

export const inlineGuide = (guide: Guide | undefined, released: boolean): Guide | undefined =>
    released ? guide : undefined;

export const headerGuideLink = <T>(link: T, shownGuide: Guide | undefined): T | undefined =>
    guidePages(shownGuide).length > 0 && !KEEP_GUIDE_LINK_WITH_INLINE_GUIDE ? undefined : link;
