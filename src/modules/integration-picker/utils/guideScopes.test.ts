import { describe, expect, it } from 'vitest';
import { Guide } from '../types';
import { connectionGuideFor, isScopeDependent, scopedGuide } from './guideScopes';

const aGuideWith = (sections: Guide['sections']): Guide => ({ sections });

describe('#isScopeDependent', () => {
    describe('when a step asks for the project’s scopes to be listed in place', () => {
        it('reports the guide as scope dependent, because the list would be missing', () => {
            // act
            const actual = isScopeDependent(
                aGuideWith([
                    {
                        title: 'Add scopes and install the app',
                        steps: [
                            {
                                title: 'Add bot token scopes',
                                content: 'Add each scope StackOne needs, one at a time:',
                                displayScopes: true,
                            },
                        ],
                    },
                ]),
            );

            // assert
            expect(actual).toBe(true);
        });
    });

    describe('when content is marked for only some of the scopes', () => {
        it('reports the guide as scope dependent, whether the mark is on a section or a step', () => {
            // act
            const actual = [
                isScopeDependent(
                    aGuideWith([
                        {
                            title: 'Grant write access',
                            content: 'Only for integrations that write back.',
                            applicableScopes: 'users:write chat:write',
                        },
                    ]),
                ),
                isScopeDependent(
                    aGuideWith([
                        {
                            title: 'Add scopes',
                            steps: [
                                { title: 'Grant write access', applicableScopes: 'files:write' },
                            ],
                        },
                    ]),
                ),
            ];

            // assert
            expect(actual).toEqual([true, true]);
        });
    });

    describe('when content is marked with a list of scopes, as the API sends it', () => {
        it('reports the guide as scope dependent, whether the mark is on a section or a step', () => {
            // act
            const actual = [
                isScopeDependent(
                    aGuideWith([
                        { title: 'Grant access', applicableScopes: ['time_off', 'workmates'] },
                    ]),
                ),
                isScopeDependent(
                    aGuideWith([
                        {
                            title: 'Add scopes',
                            steps: [{ title: 'Grant access', applicableScopes: ['recruit'] }],
                        },
                    ]),
                ),
            ];

            // assert
            expect(actual).toEqual([true, true]);
        });

        it('reports the guide as renderable when the list is empty or holds only blanks', () => {
            // act
            const actual = [
                isScopeDependent(aGuideWith([{ title: 'Grant access', applicableScopes: [] }])),
                isScopeDependent(
                    aGuideWith([
                        {
                            title: 'Add scopes',
                            steps: [{ title: 'Grant access', applicableScopes: ['', '  '] }],
                        },
                    ]),
                ),
            ];

            // assert
            expect(actual).toEqual([false, false]);
        });
    });

    describe('when the guide says nothing about scopes', () => {
        it('reports it as renderable, which is the ordinary case', () => {
            // act
            const actual = [
                isScopeDependent(
                    aGuideWith([
                        {
                            title: 'Open the API Keys page',
                            content: 'Click your avatar.',
                            steps: [{ title: 'Generate a key', content: 'Press Add New Key.' }],
                        },
                    ]),
                ),
                isScopeDependent(
                    aGuideWith([
                        {
                            title: 'Open the API Keys page',
                            applicableScopes: '  ',
                            steps: [{ title: 'Generate a key', displayScopes: false }],
                        },
                    ]),
                ),
                isScopeDependent(aGuideWith([])),
                isScopeDependent(undefined),
            ];

            // assert
            expect(actual).toEqual([false, false, false, false]);
        });
    });
});

describe('#scopedGuide', () => {
    describe('when nothing in the guide is scoped', () => {
        it('returns the guide as it is', () => {
            // arrange
            const guide = aGuideWith([
                {
                    title: 'Open the API Keys page',
                    applicableScopes: ' ',
                    steps: [{ title: 'Generate a key', applicableScopes: [] }],
                },
            ]);

            // act
            const actual = scopedGuide(guide, ['time_off']);

            // assert
            expect(actual).toEqual(
                aGuideWith([
                    {
                        title: 'Open the API Keys page',
                        steps: [{ title: 'Generate a key' }],
                    },
                ]),
            );
        });
    });

    describe('when a step is scoped', () => {
        const guide = aGuideWith([
            {
                title: 'Add scopes',
                steps: [
                    { title: 'Always' },
                    { title: 'Time off', applicableScopes: ['time_off'] },
                    { title: 'Recruit', applicableScopes: ['recruit'] },
                ],
            },
        ]);

        it('keeps it when one of its scopes is required and drops it otherwise', () => {
            // act
            const actual = scopedGuide(guide, ['time_off', 'workmates']);

            // assert
            expect(actual.sections[0].steps?.map((step) => step.title)).toEqual([
                'Always',
                'Time off',
            ]);
        });

        it('drops every scoped step when no scope is required', () => {
            // act
            const actual = scopedGuide(guide, []);

            // assert
            expect(actual.sections[0].steps?.map((step) => step.title)).toEqual(['Always']);
        });
    });

    describe('when a section is scoped', () => {
        it('drops it unless one of its scopes is required', () => {
            // arrange
            const guide = aGuideWith([
                { title: 'Always' },
                { title: 'Write access', applicableScopes: 'users:write chat:write' },
            ]);

            // act
            const actual = [
                scopedGuide(guide, ['chat:write']).sections.map((section) => section.title),
                scopedGuide(guide, ['users:read']).sections.map((section) => section.title),
            ];

            // assert
            expect(actual).toEqual([['Always', 'Write access'], ['Always']]);
        });
    });

    describe('when a step asks for its scopes to be listed', () => {
        it('appends only the required ones after the existing list items', () => {
            // arrange
            const guide = aGuideWith([
                {
                    title: 'Add scopes',
                    steps: [
                        {
                            title: 'Add bot token scopes',
                            list: ['Open OAuth & Permissions'],
                            displayScopes: true,
                            applicableScopes: 'users:read chat:write files:read',
                        },
                    ],
                },
            ]);

            // act
            const actual = scopedGuide(guide, ['chat:write', 'files:read', 'other']);

            // assert
            expect(actual.sections[0].steps).toEqual([
                {
                    title: 'Add bot token scopes',
                    list: ['Open OAuth & Permissions', '`chat:write`', '`files:read`'],
                },
            ]);
        });
    });

    describe('when a scope name contains a space', () => {
        it('keeps a listed name whole, both to match it and to display it', () => {
            // arrange
            const guide = aGuideWith([
                {
                    title: 'Add scopes',
                    steps: [
                        { title: 'Time off', applicableScopes: ['Time Off'] },
                        {
                            title: 'Grant access',
                            displayScopes: true,
                            applicableScopes: ['Time Off', 'Recruit'],
                        },
                    ],
                },
            ]);

            // act
            const actual = scopedGuide(guide, ['Time Off']);

            // assert
            expect(actual.sections[0].steps).toEqual([
                { title: 'Time off' },
                { title: 'Grant access', list: ['`Time Off`'] },
            ]);
        });

        it('reads a double-quoted run in a string as one name', () => {
            // arrange
            const guide = aGuideWith([
                {
                    title: 'Add scopes',
                    steps: [
                        {
                            title: 'Grant access',
                            displayScopes: true,
                            applicableScopes: '"Time Off" Recruit',
                        },
                    ],
                },
            ]);

            // act
            const actual = scopedGuide(guide, ['Time Off', 'Recruit']);

            // assert
            expect(actual.sections[0].steps?.[0].list).toEqual(['`Time Off`', '`Recruit`']);
        });

        it('still splits an unquoted string on whitespace', () => {
            // arrange
            const guide = aGuideWith([{ title: 'Write access', applicableScopes: 'Time Off' }]);

            // act
            const actual = [
                scopedGuide(guide, ['Off']).sections.length,
                scopedGuide(guide, ['Time Off']).sections.length,
            ];

            // assert
            expect(actual).toEqual([1, 0]);
        });
    });

    describe('when every step of a section is dropped', () => {
        it('drops the section, which would otherwise stand as a page with no task', () => {
            // arrange
            const guide = aGuideWith([
                { title: 'Always' },
                {
                    title: 'Add scopes',
                    content: 'Only some apply.',
                    steps: [{ title: 'Recruit', applicableScopes: ['recruit'] }],
                },
            ]);

            // act
            const actual = scopedGuide(guide, []);

            // assert
            expect(actual.sections.map((section) => section.title)).toEqual(['Always']);
        });
    });
});

describe('#connectionGuideFor', () => {
    const guide = aGuideWith([
        { title: 'Always' },
        { title: 'Add scopes', steps: [{ title: 'Recruit', applicableScopes: ['recruit'] }] },
    ]);

    it('withholds a scope dependent guide while the required scopes are unknown', () => {
        // act
        const actual = connectionGuideFor(guide, undefined);

        // assert
        expect(actual).toBeUndefined();
    });

    it('scopes the guide once the required scopes are known, even when none are', () => {
        // act
        const actual = connectionGuideFor(guide, []);

        // assert
        expect(actual?.sections.map((section) => section.title)).toEqual(['Always']);
    });

    it('withholds the guide when nothing is left of it', () => {
        // act
        const actual = connectionGuideFor(
            aGuideWith([{ title: 'Scoped', applicableScopes: 'recruit' }]),
            [],
        );

        // assert
        expect(actual).toBeUndefined();
    });

    it('passes a guide with no scope markers through', () => {
        // arrange
        const plain = aGuideWith([{ title: 'Always' }]);

        // act
        const actual = connectionGuideFor(plain, undefined);

        // assert
        expect(actual).toBe(plain);
    });
});
