import { z } from 'zod';
import {
    ConnectorConfigField,
    FalconFieldValidation,
    FieldValidation,
    FormatName,
    LegacyFieldValidation,
} from '../types';

// Local copy of the canonical `FORMAT_PATTERNS` registry from `@stackone/core`
// (connect repo, `packages/core/src/connector/formatPatterns.ts`) — the hub
// deliberately carries no @stackone package dependencies for this feature. Keep in
// sync when a format changes; `scripts/check-format-vectors.ts` (run via `npm test`)
// asserts this copy against the canonical accept/reject vectors so a drifted copy
// fails CI. Exported for that script.
export const FORMAT_PATTERNS: Record<FormatName, RegExp> = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    url: /^https?:\/\/\S+$/,
    uri: /^[a-zA-Z][a-zA-Z0-9+.-]*:.+$/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    date: /^\d{4}-\d{2}-\d{2}$/,
    datetime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/,
};

interface ValidationRule {
    pattern: RegExp;
    errorMessage: string;
}

function isLegacyValidation(validation: FieldValidation): validation is LegacyFieldValidation {
    return validation.type !== undefined;
}

// V2/legacy TS connectors — behaviour preserved as-is, delete wholesale when V2 retires
function resolveLegacyRule(validation: LegacyFieldValidation): ValidationRule | null {
    if (validation.type === 'html-pattern') {
        return {
            pattern: new RegExp(validation.pattern),
            errorMessage:
                validation.error || `Please match the required format: ${validation.pattern}`,
        };
    }

    if (validation.type === 'domain') {
        return {
            pattern: new RegExp(`.*${validation.pattern}\\.com.*`),
            errorMessage:
                validation.error || `Please enter a valid ${validation.pattern}.com domain`,
        };
    }

    return null;
}

function resolveFalconRule(
    validation: FalconFieldValidation,
    label: string,
): ValidationRule | null {
    if (validation.format && FORMAT_PATTERNS[validation.format]) {
        return {
            pattern: FORMAT_PATTERNS[validation.format],
            errorMessage: validation.errorMessage || `Must be a valid ${validation.format}`,
        };
    }

    if (validation.pattern) {
        return {
            pattern: new RegExp(validation.pattern),
            errorMessage: validation.errorMessage || `${label} format is invalid`,
        };
    }

    return null;
}

function resolveValidationRule(field: ConnectorConfigField): ValidationRule | null {
    if (!field.validation) return null;

    return isLegacyValidation(field.validation)
        ? resolveLegacyRule(field.validation)
        : resolveFalconRule(field.validation, field.label);
}

type RecordValidationFailure = (field: ConnectorConfigField, validation: FieldValidation) => void;

// RFC step 9 (client half): the hub is a customer-embedded package with no analytics
// dependency, so validation failures are surfaced as a DOM CustomEvent — count-only
// (field key + rule kind, never the value; values may be credentials). Hosts or
// StackOne scripts can listen via
// window.addEventListener('stackone-hub:field-validation-failed', ...).
//
// The form re-validates on every keystroke (mode: 'onTouched' + default onChange
// reValidate), so a recorder bound to one schema build dispatches at most once per
// field for the life of that schema — a "this field failed at least once" friction
// signal, not one event per keystroke. No-op outside the browser (e.g. the npm-test
// vector check).
function createValidationFailureRecorder(): RecordValidationFailure {
    const firedFields = new Set<string>();

    return (field, validation) => {
        if (typeof window === 'undefined' || firedFields.has(field.key)) return;
        firedFields.add(field.key);

        const format = isLegacyValidation(validation) ? undefined : validation.format;
        window.dispatchEvent(
            new CustomEvent('stackone-hub:field-validation-failed', {
                detail: {
                    field: field.key,
                    ruleKind: isLegacyValidation(validation)
                        ? 'legacy'
                        : format
                          ? 'format'
                          : 'pattern',
                    ...(format ? { format } : {}),
                },
            }),
        );
    };
}

function createFieldSchema(
    field: ConnectorConfigField,
    recordFailure: RecordValidationFailure,
): z.ZodTypeAny {
    let schema: z.ZodString = z.string();

    if (field.required) {
        schema = schema.min(1, `${field.label} is required`);
    }

    if (field.type === 'number') {
        if (field.required) {
            schema = schema.regex(/^\d+$/, 'Must be a valid number');
        } else {
            return z
                .string()
                .refine((val) => val === '' || /^\d+$/.test(val), 'Must be a valid number');
        }
    }

    const validation = field.validation;
    const rule = resolveValidationRule(field);
    if (rule && validation) {
        // Only record a non-empty value that failed — empty is "required", not a format
        // failure (the optional branch below short-circuits empty before testing).
        const testWithMetric = (val: string) => {
            const ok = rule.pattern.test(val);
            if (!ok && val) {
                recordFailure(field, validation);
            }
            return ok;
        };
        if (field.required) {
            return schema.refine((val) => testWithMetric(val), rule.errorMessage);
        }
        return z.string().refine((val) => val === '' || testWithMetric(val), rule.errorMessage);
    }

    if (!field.required) {
        return z.union([z.string().length(0), schema]);
    }

    return schema;
}

export function createFormSchema(fields: ConnectorConfigField[]) {
    const schemaShape: Record<string, z.ZodTypeAny> = {};

    // One recorder per schema build so the failure event dedupes per field for the life
    // of this schema instead of firing on every keystroke.
    const recordFailure = createValidationFailureRecorder();

    for (const field of fields) {
        schemaShape[field.key] = createFieldSchema(field, recordFailure);
    }

    return z.object(schemaShape);
}
