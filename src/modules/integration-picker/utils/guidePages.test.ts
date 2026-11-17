import { describe, expect, it } from 'vitest';
import { Guide } from '../types';
import { guidePages, guideSections } from './guidePages';

const aGuide = (): Guide => ({
    sections: [
        {
            title: 'Open the API Keys page',
            content: 'Click your avatar.',
            steps: [
                { title: 'Generate a key', content: 'Press `Add New Key`.', list: ['Name it'] },
                { title: 'Copy the key', content: 'Paste it below.' },
            ],
        },
        { title: 'Paste the key below', content: 'It is shown once.' },
    ],
});

describe('#guidePages', () => {
    describe('when a section has steps', () => {
        it('makes one page per step, each carrying the section title and introduction', () => {
            // act
            const actual = guidePages(aGuide()).slice(0, 2);

            // assert
            expect(actual).toEqual([
                {
                    title: 'Generate a key',
                    content: 'Press `Add New Key`.',
                    list: ['Name it'],
                    image: undefined,
                    sectionTitle: 'Open the API Keys page',
                    sectionIntro: 'Click your avatar.',
                    isWholeSection: false,
                },
                {
                    title: 'Copy the key',
                    content: 'Paste it below.',
                    list: undefined,
                    image: undefined,
                    sectionTitle: 'Open the API Keys page',
                    sectionIntro: 'Click your avatar.',
                    isWholeSection: false,
                },
            ]);
        });
    });

    describe('when a section has no steps', () => {
        it('makes a single whole-section page whose text is the section introduction', () => {
            // act
            const actual = guidePages(aGuide())[2];

            // assert
            expect(actual).toMatchObject({
                title: 'Paste the key below',
                content: '',
                sectionIntro: 'It is shown once.',
                isWholeSection: true,
            });
        });
    });

    describe('when the connector ships no guide, or an empty one', () => {
        it('produces no pages, so the form is left exactly as it was', () => {
            // act
            const actual = [guidePages(undefined), guidePages({ sections: [] })];

            // assert
            expect(actual).toEqual([[], []]);
        });
    });
});

describe('#guideSections', () => {
    it('names each section with the number of pages it takes', () => {
        // act
        const actual = guideSections(aGuide());

        // assert
        expect(actual).toEqual([
            { label: 'Open the API Keys page', steps: 2 },
            { label: 'Paste the key below', steps: 1 },
        ]);
    });
});
