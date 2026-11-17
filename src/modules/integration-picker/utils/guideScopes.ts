import { Guide, GuideSection, GuideStep } from '../types';

type Scopes = ReadonlyArray<string> | string | undefined;

const SCOPE_TOKEN_REGEX = /"([^"]*)"|(\S+)/g;

const tokenizeScopes = (scopes: string): Array<string> =>
    Array.from(scopes.matchAll(SCOPE_TOKEN_REGEX), (match) => match[1] ?? match[2]);

/**
 * A list holds whole scope names, some of which contain spaces. A string is split the way the
 * connector parser splits it, where a double-quoted run is one name.
 */
const scopeNames = (scopes: Scopes): Array<string> => {
    const items = Array.isArray(scopes)
        ? (scopes as ReadonlyArray<string>)
        : typeof scopes === 'string'
          ? tokenizeScopes(scopes)
          : [];
    return items.map((name) => name.trim()).filter((name) => name.length > 0);
};

const names = (scopes: Scopes): boolean => scopeNames(scopes).length > 0;

const appliesTo = (scopes: Scopes, requiredScopes: ReadonlySet<string>): boolean =>
    !names(scopes) || scopeNames(scopes).some((name) => requiredScopes.has(name));

const scopedStep = (
    step: GuideStep,
    requiredScopes: ReadonlySet<string>,
): GuideStep | undefined => {
    if (!appliesTo(step.applicableScopes, requiredScopes)) {
        return undefined;
    }

    const { applicableScopes, displayScopes, ...rest } = step;
    const listed = displayScopes
        ? scopeNames(applicableScopes)
              .filter((name) => requiredScopes.has(name))
              .map((name) => `\`${name}\``)
        : [];

    return listed.length > 0 ? { ...rest, list: [...(step.list ?? []), ...listed] } : rest;
};

const scopedSection = (
    section: GuideSection,
    requiredScopes: ReadonlySet<string>,
): GuideSection | undefined => {
    if (!appliesTo(section.applicableScopes, requiredScopes)) {
        return undefined;
    }

    const { applicableScopes: _applicableScopes, steps, ...rest } = section;

    if (steps === undefined || steps.length === 0) {
        return rest;
    }

    const visibleSteps = steps.flatMap((step) => scopedStep(step, requiredScopes) ?? []);

    return visibleSteps.length > 0 ? { ...rest, steps: visibleSteps } : undefined;
};

/**
 * The guide as it reads for a project that asked for `requiredScopes`. Unscoped content always
 * stays, scoped content stays when one of its scopes is required, and a section whose steps
 * are all removed goes with them, since its text alone would stand as a page with no task.
 * The result carries no scope markers.
 */
export const scopedGuide = (guide: Guide, requiredScopes: ReadonlyArray<string>): Guide => {
    const required = new Set(requiredScopes);

    return {
        ...guide,
        sections: guide.sections.flatMap((section) => scopedSection(section, required) ?? []),
    };
};

/**
 * Whether the guide is written against the scopes a project asked for. `applicableScopes`
 * marks a section or a step that only some of them call for, and `displayScopes` asks for the
 * scopes themselves to be listed in place, under an instruction that introduces them.
 *
 * Such a guide is only complete once `scopedGuide` has applied the project's scopes to it.
 */
export const isScopeDependent = (guide: Guide | undefined): boolean =>
    (guide?.sections ?? []).some(
        (section) =>
            names(section.applicableScopes) ||
            (section.steps ?? []).some(
                (step) => names(step.applicableScopes) || step.displayScopes === true,
            ),
    );

/**
 * The guide to show beside the form. A scope dependent guide needs `requiredScopes` to be
 * written in full, so without them it is withheld; a guide left with no sections is withheld too.
 */
export const connectionGuideFor = (
    guide: Guide | undefined,
    requiredScopes: ReadonlyArray<string> | undefined,
): Guide | undefined => {
    if (!guide || !isScopeDependent(guide)) {
        return guide;
    }
    if (requiredScopes === undefined) {
        return undefined;
    }

    const scoped = scopedGuide(guide, requiredScopes);

    return scoped.sections.length > 0 ? scoped : undefined;
};
