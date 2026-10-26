import type { PartialMalachiteTheme } from '@stackone/malachite';
import React from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { StackOneHub } from './StackOneHub';
import type { HubModes } from './types/types';

type SuccessHandler = (account: { id: string; provider: string }) => void;
type CloseHandler = () => void;
type ThemeProp = 'light' | 'dark' | PartialMalachiteTheme;

const OBSERVED_ATTRS = [
    'token',
    'base-url',
    'app-url',
    'mode',
    'height',
    'theme',
    'account-id',
    'on-close-label',
    'show-footer-links',
    'closable',
    'debug',
] as const;

const parseBool = (value: string | null): boolean | undefined => {
    if (value === null) {
        return undefined;
    }
    if (value === '' || value === 'true') {
        return true;
    }
    if (value === 'false') {
        return false;
    }
    return undefined;
};

const parseTheme = (value: string | null): ThemeProp | undefined => {
    if (value === null) {
        return undefined;
    }
    if (value === 'light' || value === 'dark') {
        return value;
    }
    try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as PartialMalachiteTheme;
        }
    } catch {
        return undefined;
    }
    return undefined;
};

const VALID_MODES: readonly HubModes[] = ['integration-picker'];

const parseMode = (value: string | null): HubModes | undefined => {
    return VALID_MODES.includes(value as HubModes) ? (value as HubModes) : undefined;
};

class StackOneHubElement extends HTMLElement {
    static get observedAttributes(): readonly string[] {
        return OBSERVED_ATTRS;
    }

    private root: Root | null = null;
    private _themeObject?: PartialMalachiteTheme;

    onSuccess?: SuccessHandler;
    onClose?: CloseHandler;
    private _onCancel?: CloseHandler;

    /** Setting it shows the header's close control, the same as the `closable` attribute. */
    get onCancel(): CloseHandler | undefined {
        return this._onCancel;
    }

    set onCancel(value: CloseHandler | undefined) {
        this._onCancel = value;
        if (this.root) {
            this.render();
        }
    }

    get themeObject(): PartialMalachiteTheme | undefined {
        return this._themeObject;
    }

    set themeObject(value: PartialMalachiteTheme | undefined) {
        this._themeObject = value;
        if (this.root) {
            this.render();
        }
    }

    connectedCallback() {
        if (!this.root) {
            this.root = createRoot(this);
        }
        this.render();
    }

    disconnectedCallback() {
        if (this.root) {
            this.root.unmount();
            this.root = null;
        }
    }

    attributeChangedCallback() {
        if (this.root) {
            this.render();
        }
    }

    private render() {
        if (!this.root) {
            return;
        }

        const handleSuccess: SuccessHandler = (account) => {
            this.dispatchEvent(
                new CustomEvent('success', {
                    detail: account,
                    bubbles: true,
                    composed: true,
                }),
            );
            this.onSuccess?.(account);
        };

        const handleClose: CloseHandler = () => {
            this.dispatchEvent(
                new CustomEvent('close', {
                    bubbles: true,
                    composed: true,
                }),
            );
            this.onClose?.();
        };

        // Only a host that asked for the header's close control, by attribute or by property,
        // gets it, so an existing embed keeps the header it has.
        const handleCancel: CloseHandler = () => {
            this.dispatchEvent(
                new CustomEvent('cancel', {
                    bubbles: true,
                    composed: true,
                }),
            );
            this._onCancel?.();
        };
        const closable = parseBool(this.getAttribute('closable')) || this._onCancel !== undefined;

        const theme: ThemeProp =
            this._themeObject ?? parseTheme(this.getAttribute('theme')) ?? 'light';

        this.root.render(
            React.createElement(StackOneHub, {
                token: this.getAttribute('token') ?? undefined,
                baseUrl: this.getAttribute('base-url') ?? undefined,
                appUrl: this.getAttribute('app-url') ?? undefined,
                mode: parseMode(this.getAttribute('mode')),
                height: this.getAttribute('height') ?? undefined,
                theme,
                accountId: this.getAttribute('account-id') ?? undefined,
                onCloseLabel: this.getAttribute('on-close-label') ?? undefined,
                showFooterLinks: parseBool(this.getAttribute('show-footer-links')),
                debug: parseBool(this.getAttribute('debug')),
                onSuccess: handleSuccess,
                onClose: handleClose,
                onCancel: closable ? handleCancel : undefined,
            }),
        );
    }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
    if (!customElements.get('stackone-hub')) {
        customElements.define('stackone-hub', StackOneHubElement);
    }
}
