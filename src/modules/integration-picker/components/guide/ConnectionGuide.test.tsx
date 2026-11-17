// @vitest-environment jsdom
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { MountedView, clickOn, withMounted } from '../../../../shared/testing/clientRender';
import { Guide } from '../../types';
import { ConnectionGuide } from './ConnectionGuide';

const aGuide = (): Guide => ({
    warning: 'You need owner access in BambooHR to generate a key.',
    sections: [
        {
            title: 'Open the API Keys page',
            content: 'Click your avatar.',
            steps: [
                {
                    title: 'Find the menu item',
                    content: 'Open the menu.',
                    image: { src: 'images/api-keys.png', alt: 'The API Keys menu item' },
                },
                {
                    title: 'Generate a key',
                    content: 'Press Add New Key.',
                    image: { src: 'images/add-new-key.png', alt: 'The Add New Key button' },
                },
            ],
        },
        { title: 'Paste the key below', content: 'It is shown once.' },
    ],
});

const byLabel = (view: MountedView, label: string): HTMLButtonElement => {
    const match = view.container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
    if (!match) {
        throw new Error(`No button labelled "${label}"`);
    }
    return match;
};

const GuideHarness = ({ guide }: { guide: Guide }) => {
    const [page, setPage] = useState(0);
    return (
        <ConnectionGuide
            connectorKey="bamboohr"
            guide={guide}
            layout="beside"
            page={page}
            onPageChange={setPage}
        />
    );
};

const renderGuide = <T,>(body: (view: MountedView) => T, guide: Guide = aGuide()): T =>
    withMounted(<GuideHarness guide={guide} />, body);

const next = (view: MountedView) => view.interact(() => clickOn(byLabel(view, 'Next step')));
const previous = (view: MountedView) =>
    view.interact(() => clickOn(byLabel(view, 'Previous step')));

describe('#ConnectionGuide', () => {
    describe('on the first page', () => {
        it('shows the section introduction, the step and the warning', () => {
            // act
            const actual = renderGuide((view) => view.text());

            // assert
            expect(actual).toContain('Open the API Keys page');
            expect(actual).toContain('Click your avatar.');
            expect(actual).toContain('Find the menu item');
            expect(actual).toContain('You need owner access');
            expect(actual).not.toContain('Generate a key');
        });
    });

    describe('when the reader turns to the next step of the same section', () => {
        it('keeps the section introduction and drops the warning', () => {
            // act
            const actual = renderGuide((view) => {
                next(view);
                return view.text();
            });

            // assert
            expect(actual).toContain('Click your avatar.');
            expect(actual).toContain('Generate a key');
            expect(actual).not.toContain('You need owner access');
        });
    });

    describe('on a section without steps', () => {
        it('shows the section as one page with no step heading of its own', () => {
            // act
            const actual = renderGuide((view) => {
                next(view);
                next(view);
                return {
                    text: view.text(),
                    headings: view.container.querySelectorAll('h3').length,
                };
            });

            // assert
            expect(actual.text).toContain('It is shown once.');
            expect(actual.headings).toBe(0);
        });
    });

    describe('the footer arrows', () => {
        it('are disabled at the ends of the guide', () => {
            // act
            const actual = renderGuide((view) => {
                const atFirst = byLabel(view, 'Previous step').disabled;
                next(view);
                next(view);
                const atLast = byLabel(view, 'Next step').disabled;
                previous(view);
                return { atFirst, atLast, backInMiddle: byLabel(view, 'Next step').disabled };
            });

            // assert
            expect(actual).toEqual({ atFirst: true, atLast: true, backInMiddle: false });
        });
    });

    describe('the stepper', () => {
        it('is offered only when there is more than one page', () => {
            // act
            const actual = [
                renderGuide((view) => view.container.querySelector('[aria-label="Setup steps"]')),
                renderGuide((view) => view.container.querySelector('[aria-label="Setup steps"]'), {
                    sections: [{ title: 'Only page', content: 'Alone.' }],
                }),
            ];

            // assert
            expect(actual[0]).not.toBeNull();
            expect(actual[1]).toBeNull();
        });
    });

    describe('when a screenshot fails to load and the reader turns the page', () => {
        it('shows the next page’s screenshot, which has not failed', () => {
            // act
            const actual = renderGuide((view) => {
                view.interact(() => {
                    view.container
                        .querySelector('img')
                        ?.dispatchEvent(new Event('error', { bubbles: false }));
                });
                const whereItFailed = view.container.querySelector('img');
                next(view);
                const onTheNextPage = view.container.querySelector('img')?.getAttribute('src');
                return { whereItFailed, onTheNextPage };
            });

            // assert
            expect(actual.whereItFailed).toBeNull();
            expect(actual.onTheNextPage).toBe(
                'https://docs.stackone.com/connectors/bamboohr/images/add-new-key.png',
            );
        });
    });

    describe('when the guide has no sections', () => {
        it('renders nothing', () => {
            // act
            const actual = renderGuide((view) => view.html(), { sections: [] });

            // assert
            expect(actual).toBe('');
        });
    });
});
