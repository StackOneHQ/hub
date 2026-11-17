import { describe, expect, it } from 'vitest';
import { GUIDE_BESIDE_MIN_WIDTH_PX, guideLayout } from './guideLayout';

describe('#guideLayout', () => {
    describe('when the container is at least as wide as the threshold', () => {
        it('puts the guide beside the form', () => {
            // act
            const actual = [
                guideLayout(GUIDE_BESIDE_MIN_WIDTH_PX),
                guideLayout(672),
                guideLayout(760),
            ];

            // assert
            expect(actual).toEqual(['beside', 'beside', 'beside']);
        });
    });

    describe('when the container is narrower than the threshold', () => {
        it('stacks the guide under the form', () => {
            // act
            const actual = [
                guideLayout(GUIDE_BESIDE_MIN_WIDTH_PX - 1),
                guideLayout(490),
                guideLayout(480),
                guideLayout(0),
            ];

            // assert
            expect(actual).toEqual(['stacked', 'stacked', 'stacked', 'stacked']);
        });
    });

    describe('when the container has not been measured yet', () => {
        it('stacks the guide, which is the layout that fits any container', () => {
            // act
            const actual = guideLayout(undefined);

            // assert
            expect(actual).toBe('stacked');
        });
    });
});
