import { describe, expect, it } from 'vitest';
import { guideImageUrl } from './guideImageUrl';

describe('#guideImageUrl', () => {
    describe('when the source is relative, which every guide image in the catalogue is', () => {
        it('resolves it against the connector page on the docs site', () => {
            // act
            const actual = guideImageUrl('bamboohr', 'images/bamboohr-config-01-api-keys.png');

            // assert
            expect(actual).toBe(
                'https://docs.stackone.com/connectors/bamboohr/images/bamboohr-config-01-api-keys.png',
            );
        });
    });

    describe('when the source carries a leading separator', () => {
        it('resolves it without doubling the slash', () => {
            // act
            const actual = guideImageUrl('zendesk', './images/custom-config-add-api-token.png');

            // assert
            expect(actual).toBe(
                'https://docs.stackone.com/connectors/zendesk/images/custom-config-add-api-token.png',
            );
        });
    });

    describe('when the source is already absolute', () => {
        it('passes it through untouched, so an externally hosted screenshot is not rewritten', () => {
            // act
            const actual = guideImageUrl('webflow', 'https://cdn.example.test/api-access.png');

            // assert
            expect(actual).toBe('https://cdn.example.test/api-access.png');
        });
    });

    describe('when the source is empty or blank', () => {
        it('resolves to nothing, so no broken image is rendered', () => {
            // act
            const actual = [guideImageUrl('bamboohr', ''), guideImageUrl('bamboohr', '   ')];

            // assert
            expect(actual).toEqual([undefined, undefined]);
        });
    });

    describe('when the connector key is empty', () => {
        it('resolves to nothing rather than building a URL that points at the docs index', () => {
            // act
            const actual = guideImageUrl('', 'images/api-keys.png');

            // assert
            expect(actual).toBeUndefined();
        });
    });
});
