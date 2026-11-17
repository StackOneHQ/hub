import { type ReactElement, act } from 'react';
import { createRoot } from 'react-dom/client';

(
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

export interface MountedView {
    container: HTMLElement;
    text: () => string;
    html: () => string;
    button: (label: string) => HTMLButtonElement;
    interact: (run: () => void) => void;
}

/**
 * Mounts into jsdom and tears the root down again, whatever the body does. Effects do not run
 * under `renderToString`, so anything that only happens once the hub has measured itself, or
 * once someone has pressed something, can only be reached from a real client render.
 */
export const withMounted = <T>(element: ReactElement, body: (view: MountedView) => T): T => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const view: MountedView = {
        container,
        text: () => container.textContent ?? '',
        html: () => container.innerHTML,
        button: (label) => {
            const match = Array.from(container.querySelectorAll('button')).find(
                (candidate) => candidate.textContent?.trim() === label,
            );
            if (!match) {
                throw new Error(`No button labelled "${label}" is rendered`);
            }
            return match;
        },
        interact: (run) => {
            act(() => {
                run();
            });
        },
    };

    try {
        act(() => {
            root.render(element);
        });
        return body(view);
    } finally {
        act(() => {
            root.unmount();
        });
        container.remove();
    }
};

export const clickOn = (element: Element): void => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

const rectOfWidth = (width: number): DOMRect => ({
    width,
    height: 600,
    top: 0,
    left: 0,
    right: width,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON: () => ({}),
});

export interface StubbedLayout {
    resizeTo: (next: number) => void;
    restore: () => void;
}

/**
 * jsdom lays nothing out, so every element measures zero wide and nothing ever reports a
 * resize. Both are supplied here, so a component that chooses its layout from its own width
 * sees the width a host would really have given it. Wrap `resizeTo` in `interact`.
 */
export const stubLayoutWidth = (initial: number): StubbedLayout => {
    let measured = initial;
    const observers = new Set<(entries: ResizeObserverEntry[]) => void>();

    const originalRect = Element.prototype.getBoundingClientRect;
    const originalResizeObserver = globalThis.ResizeObserver;

    Element.prototype.getBoundingClientRect = () => rectOfWidth(measured);
    globalThis.ResizeObserver = class {
        private readonly callback: (entries: ResizeObserverEntry[]) => void;

        constructor(callback: (entries: ResizeObserverEntry[]) => void) {
            this.callback = callback;
        }

        observe() {
            observers.add(this.callback);
        }

        unobserve() {
            observers.delete(this.callback);
        }

        disconnect() {
            observers.delete(this.callback);
        }
    } as unknown as typeof ResizeObserver;

    return {
        resizeTo: (next) => {
            measured = next;
            for (const notify of observers) {
                notify([]);
            }
        },
        restore: () => {
            Element.prototype.getBoundingClientRect = originalRect;
            globalThis.ResizeObserver = originalResizeObserver;
        },
    };
};
