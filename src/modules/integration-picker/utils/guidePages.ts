import { Guide, GuideImage, GuideSection } from '../types';

export interface GuidePage {
    title: string;
    content: string;
    list?: Array<string>;
    image?: GuideImage;
    sectionTitle: string;
    /** The section's introduction, carried by every page of the section. */
    sectionIntro?: string;
    /** A section without steps is a single page, whose text is the section's own introduction. */
    isWholeSection: boolean;
}

const pagesOfSection = (section: GuideSection): Array<GuidePage> => {
    const steps = section.steps ?? [];

    if (steps.length === 0) {
        return [
            {
                title: section.title,
                content: '',
                list: section.list,
                image: section.image,
                sectionTitle: section.title,
                sectionIntro: section.content,
                isWholeSection: true,
            },
        ];
    }

    return steps.map((step) => ({
        title: step.title,
        content: step.content ?? '',
        list: step.list,
        image: step.image,
        sectionTitle: section.title,
        sectionIntro: section.content,
        isWholeSection: false,
    }));
};

/** One page per step, or one page for a section that has no steps. */
export const guidePages = (guide: Guide | undefined): Array<GuidePage> =>
    (guide?.sections ?? []).flatMap(pagesOfSection);

/** Each section and how many pages it takes, in the order `guidePages` lays them out. */
export const guideSections = (guide: Guide | undefined): Array<{ label: string; steps: number }> =>
    (guide?.sections ?? []).map((section) => ({
        label: section.title,
        steps: pagesOfSection(section).length,
    }));
