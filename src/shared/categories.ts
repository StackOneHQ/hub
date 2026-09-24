// Mirrors the connectors page in unified-cloud (`shared/utils/categories.ts`), because both
// render whatever category the API reports and the catalog mixes lowercase slugs, title case
// and acronyms — `hris` and `HRIS` are one category, and `project_management` reads as words.
// unified-cloud consults a CATEGORIES_MAP first; every entry there uppercases to the same
// string this produces, so it is left out rather than duplicated as a no-op table.

const words = (category: string): string[] => category.split(/[-_\s]+/).filter(Boolean);

// Compare and group on this, never on the reported spelling. unified-cloud only lowercases
// here, which leaves `project_management` and `Project Management` as two keys that render
// one label — i.e. two identical filters. Splitting first folds those together too.
export const getConnectorCategoryKey = (category: string): string =>
    words(category).join(' ').toLowerCase();

export const formatConnectorCategoryLabel = (category: string): string =>
    words(category).join(' ').toUpperCase();
