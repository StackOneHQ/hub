import { ConnectorConfigField } from '../types';

export function getPatternValidator(
    validation?: ConnectorConfigField['validation'],
): string | undefined {
    if (!validation) {
        return undefined;
    }

    if (validation.type === 'html-pattern') {
        return validation.pattern;
    } else if (validation.type === 'domain') {
        return `.*${validation.pattern}\\.com.*`;
    }

    return undefined;
}

export function getCustomValidityMessage(
    validation?: ConnectorConfigField['validation'],
): string | undefined {
    if (!validation) {
        return undefined;
    }

    return validation.error || getDefaultErrorMessage(validation);
}

function getDefaultErrorMessage(validation: ConnectorConfigField['validation']): string {
    if (!validation) {
        return 'Please enter a valid value';
    }

    if (validation.type === 'html-pattern') {
        return `Please match the required format: ${validation.pattern}`;
    } else if (validation.type === 'domain') {
        return `Please enter a valid ${validation.pattern}.com domain`;
    }

    return 'Please enter a valid value';
}

export function validateField(
    value: string,
    validation?: ConnectorConfigField['validation'],
): {
    isValid: boolean;
    errorMessage?: string;
} {
    if (!validation) {
        return { isValid: true };
    }

    const pattern = getPatternValidator(validation);
    if (pattern) {
        const regex = new RegExp(pattern);
        const isValid = regex.test(value);

        if (!isValid) {
            return {
                isValid: false,
                errorMessage: getCustomValidityMessage(validation),
            };
        }
    }

    return { isValid: true };
}

export function setCustomValidity(
    element: HTMLInputElement | HTMLTextAreaElement,
    validation?: ConnectorConfigField['validation'],
    value?: string,
): void {
    if (!validation) {
        element.setCustomValidity('');
        return;
    }

    if (value) {
        const validationResult = validateField(value, validation);
        if (!validationResult.isValid && validationResult.errorMessage) {
            element.setCustomValidity(validationResult.errorMessage);
        } else {
            element.setCustomValidity('');
        }
    } else {
        element.setCustomValidity('');
    }
}
