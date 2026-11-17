import { useState } from 'react';

interface GuideReaderState {
    resetKey: string | undefined;
    page: number;
    shown: boolean;
}

/**
 * The reader's place in the guide, held above the components that show it so the guide can
 * move between placements, or be unmounted while hidden, without losing the step. The state
 * is tagged with the key it belongs to, so a different key starts a fresh reading during the
 * same render instead of one render later.
 */
export const useGuideReader = (resetKey: string | undefined) => {
    const [state, setState] = useState<GuideReaderState>({
        resetKey,
        page: 0,
        shown: true,
    });

    const current: GuideReaderState =
        state.resetKey === resetKey ? state : { resetKey, page: 0, shown: true };

    const setPage = (page: number) => setState({ ...current, page });
    const toggleShown = () => setState({ ...current, shown: !current.shown });

    return { page: current.page, setPage, shown: current.shown, toggleShown };
};
