import { isString } from '@stackone/utils';

const SECRET_PLACEHOLDER_REGEX = /^__secretvalue:\*\*redacted\*\*(.*)$/;

/**
 * Checks if a value is a secret placeholder string
 */
export const isSecretPlaceholder = (value: unknown): boolean => {
    return isString(value) && SECRET_PLACEHOLDER_REGEX.test(value);
};

/**
 * Formats a secret placeholder value for display
 */
export const formatSecretPlaceholder = (value: string): string => {
    const dots = '••••••••••'; // 10 dots

    if (!isSecretPlaceholder(value)) {
        return value;
    }

    const match = value.match(SECRET_PLACEHOLDER_REGEX);
    if (!match) {
        return dots;
    }

    const lastChars = match[1];
    if (lastChars) {
        return dots + lastChars;
    }

    return dots;
};
