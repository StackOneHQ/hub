import { useEffect, useState } from 'react';

/**
 * Reports the rendered width of the element the returned ref is put on, and keeps reporting
 * it as the host resizes. `undefined` until the first measurement, so a first paint during
 * server rendering has nothing to guess from.
 *
 * The ref is a callback kept in state rather than a `useRef`, because the effect has to run
 * again when the element it measures is mounted or swapped.
 */
export const useMeasuredWidth = <T extends HTMLElement>(): [
    (node: T | null) => void,
    number | undefined,
] => {
    const [element, setElement] = useState<T | null>(null);
    const [width, setWidth] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (!element) {
            return;
        }

        const measure = () => setWidth(element.getBoundingClientRect().width);
        measure();

        if (typeof ResizeObserver === 'undefined') {
            return;
        }

        const observer = new ResizeObserver(measure);
        observer.observe(element);
        return () => observer.disconnect();
    }, [element]);

    return [setElement, width];
};
