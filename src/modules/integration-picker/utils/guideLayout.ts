export type GuideLayout = 'beside' | 'stacked';

/**
 * The narrowest the hub can be and still carry the guide in a column beside the form. Below
 * it the guide goes under the form, a step at a time.
 */
export const GUIDE_BESIDE_MIN_WIDTH_PX = 510;

/**
 * The hub has no width prop: every host sizes it from its own container, and one of them
 * takes that width from a query parameter. So the layout is chosen from the width the hub
 * was actually given, not from which flow it believes it is in. An unmeasured width takes
 * the stacked layout, which fits in any container.
 */
export const guideLayout = (width: number | undefined): GuideLayout =>
    width !== undefined && width >= GUIDE_BESIDE_MIN_WIDTH_PX ? 'beside' : 'stacked';
