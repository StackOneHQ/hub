import { z } from 'zod';
import {
    ConnectorConfigField,
    FalconFieldValidation,
    FieldValidation,
    FormatName,
    LegacyFieldValidation,
} from '../types';
import { hasCatastrophicBacktrackingRisk } from './regexSafety';
import { isSecretPlaceholder } from './secretPlaceholder';

// Local copy of the canonical `FORMAT_PATTERNS` registry from `@stackone/core`
// (connect repo, `packages/core/src/connector/formatPatterns.ts`) — the hub
// deliberately carries no @stackone package dependencies for this feature.
// `scripts/check-format-vectors.ts` (run via `npm test`) gates this copy two ways:
// pinned accept/reject vectors, and pinned canonical regex sources (catches
// language-identical rewrites the vectors cannot see). Both pins are hub-local
// snapshots and there is no live comparison (connect is a private repo), so a format
// ADDED upstream is NOT caught automatically — sync this copy, the vectors and the
// pinned sources together, manually, when connect's registry changes. Exported for
// that script.
export const FORMAT_PATTERNS: Record<FormatName, RegExp> = {
    // The lookahead pins the required interior dot without the overlapping
    // `[^\s@]+\.[^\s@]+` tail, whose mutual backtracking is quadratic on long
    // non-matching input — and this pattern runs on every keystroke.
    // Language-identical to the overlapping form (fuzz-verified in @stackone/core).
    email: /^[^\s@]+@(?=[^\s@]+\.[^\s@])[^\s@]+$/,
    // Host and path/query/fragment split on a disjoint `[/?#]` boundary so the engine
    // can never backtrack between them — the overlapping `[^\s/?#]+\S*` form is
    // quadratic on long non-matching input, and this pattern runs on every keystroke.
    url: /^https?:\/\/[^\s/?#]+(?:[/?#]\S*)?$/,
    uri: /^[a-zA-Z][a-zA-Z0-9+.-]*:\S+$/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    date: /^\d{4}-\d{2}-\d{2}$/,
    datetime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[Zz]|[+-]\d{2}(?::?\d{2})?)?$/,
};

interface ValidationRule {
    pattern: RegExp;
    errorMessage: string;
    // Author-supplied patterns (legacy html-pattern/domain, Falcon pattern) pass the
    // ReDoS lint but can still backtrack quadratically on long input (adjacent unbounded
    // quantifiers, a shape the star-height lint deliberately misses), so their input is
    // length-capped. FORMAT_PATTERNS are canonical + linear and never capped.
    capInput?: boolean;
}

// The star-height lint (regexSafety.ts, canonical connect-sdk copy) catches exponential
// backtracking; it does not catch the quadratic "adjacent unbounded quantifier" shape,
// which some live legacy patterns have. Bound the value fed to an author pattern so a
// pathological one can't hang the tab on crafted long input — the same mitigation the
// canonical lint's own docstring recommends. Auth values (tenant, key, url) are far
// shorter; a value over the cap fails open (skips the rule), matching the degrade elsewhere.
const MAX_PATTERN_INPUT_LENGTH = 512;

function isLegacyValidation(validation: FieldValidation): validation is LegacyFieldValidation {
    return validation.type !== undefined;
}

// Compile a pattern, degrading to null (no rule) rather than breaking the form, for two
// distinct hazards: an uncompilable pattern would throw inside the render `useMemo` and
// trip the error boundary (whole hub replaced, connector unlinkable), and a
// catastrophic-backtracking pattern would hang the tab at match time — the rule runs on
// every keystroke, and only the compile guard could ever catch the first hazard, not the
// second. connect-sdk rejects both at connector build time, but that gate covers neither
// connectors built before it existed nor the legacy TS path, so re-guard both here.
// Fail open but loudly: a skipped rule degrades to today's no-validation behaviour, and
// each path warns so the field never renders unvalidated silently on the only enforcement
// layer (matches the unknown-format branch below).
function compileRegex(source: string): RegExp | null {
    if (hasCatastrophicBacktrackingRisk(source)) {
        console.warn(
            `[stackone-hub] pattern "${source}" risks catastrophic backtracking — field validation skipped`,
        );
        return null;
    }
    try {
        return new RegExp(source);
    } catch {
        console.warn(
            `[stackone-hub] pattern "${source}" failed to compile — field validation skipped`,
        );
        return null;
    }
}

// V2/legacy TS connectors — behaviour preserved as-is, delete wholesale when V2 retires
function resolveLegacyRule(validation: LegacyFieldValidation): ValidationRule | null {
    if (validation.type === 'html-pattern') {
        const pattern = compileRegex(validation.pattern);
        if (!pattern) return null;
        return {
            pattern,
            capInput: true,
            errorMessage:
                validation.error || `Please match the required format: ${validation.pattern}`,
        };
    }

    if (validation.type === 'domain') {
        const pattern = compileRegex(`.*${validation.pattern}\\.com.*`);
        if (!pattern) return null;
        return {
            pattern,
            capInput: true,
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
    if (validation.format) {
        const pattern = FORMAT_PATTERNS[validation.format];
        if (!pattern) {
            // Unknown format: connect-sdk derives its `format` enum from the canonical
            // registry keys, so a format it accepts is missing here — this copy has drifted
            // from `@stackone/core`. Fail open (failing closed would lock customers out on a
            // hub-version skew) but loudly, since the field then renders unvalidated on the
            // only enforcement layer. `scripts/check-format-vectors.ts` should catch this in
            // CI; this warns at runtime if a drift ever reaches a customer.
            console.warn(
                `[stackone-hub] no pattern for format "${validation.format}" — field validation skipped; hub FORMAT_PATTERNS has drifted from @stackone/core`,
            );
            return null;
        }
        return {
            pattern,
            errorMessage: validation.errorMessage || `Must be a valid ${validation.format}`,
        };
    }

    if (validation.pattern) {
        const pattern = compileRegex(validation.pattern);
        if (!pattern) return null;
        return {
            pattern,
            capInput: true,
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

export type RecordValidationFailure = (
    field: ConnectorConfigField,
    validation: FieldValidation,
) => void;

// RFC step 9 (client half): the hub is a customer-embedded package with no analytics
// dependency, so validation failures are surfaced as a DOM CustomEvent — count-only
// (connector key + field key + rule kind, never the value; values may be
// credentials). Hosts or StackOne scripts can listen via
// window.addEventListener('stackone-hub:field-validation-failed', ...).
//
// Lifetime: the recorder must be owned by the rendering component for the life of the
// form session (useMemo keyed on the connector) and passed into createFormSchema — NOT
// created per schema build. The schema is rebuilt whenever the connector or account data
// changes (useIntegrationPicker's `fields` memo, deps [connectorData, selectedIntegration,
// accountData, hubData]), so a recorder owned by the schema would reset its per-field
// dedupe on each of those rebuilds; owning it in the component keeps the dedupe for the
// whole session. No-op outside the browser (e.g. the npm-test vector check).
export function createValidationFailureRecorder(connector?: string): RecordValidationFailure {
    const firedFields = new Set<string>();

    return (field, validation) => {
        if (typeof window === 'undefined' || firedFields.has(field.key)) return;
        firedFields.add(field.key);

        const format = isLegacyValidation(validation) ? undefined : validation.format;
        window.dispatchEvent(
            new CustomEvent('stackone-hub:field-validation-failed', {
                detail: {
                    ...(connector ? { connector } : {}),
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
        // Per the connector schema, number fields carry no `validation:`, so they never
        // reach the rule section below. A saved secret pre-fills as the redacted sentinel
        // and must pass on reconnect (same as string fields), so admit it alongside the
        // numeric check — otherwise `/^\d+$/` rejects the sentinel and gates Connect.
        const isNumericOrSecret = (val: string) => isSecretPlaceholder(val) || /^\d+$/.test(val);
        if (field.required) {
            return z
                .string()
                .min(1, `${field.label} is required`)
                .refine(isNumericOrSecret, 'Must be a valid number');
        }
        return z
            .string()
            .refine((val) => val === '' || isNumericOrSecret(val), 'Must be a valid number');
    }

    const validation = field.validation;
    const rule = resolveValidationRule(field);
    if (rule && validation) {
        const testWithMetric = (val: string) => {
            // A saved secret is pre-filled as the redacted sentinel (`__secretvalue:**…`),
            // not the real value the customer typed. RHF validates `defaultValues` eagerly,
            // so without this guard the sentinel would fail the rule before the user touches
            // anything — blocking reconnect (gating the Connect button) and emitting a
            // failure event for an untouched field. Treat it as valid.
            if (isSecretPlaceholder(val)) return true;
            // An author pattern over the length cap can't be run safely (see
            // MAX_PATTERN_INPUT_LENGTH); skip it (fail-open) rather than risk a hang.
            if (rule.capInput && val.length > MAX_PATTERN_INPUT_LENGTH) return true;
            // The `&& val` guard is load-bearing: zod 4 accumulates all checks (it does not
            // short-circuit on `.min(1)`), so this predicate runs on empty values too. Empty
            // is a "required" failure, not a format failure — without `&& val` every
            // untouched required field would emit a spurious event.
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

// `recordFailure` is owned by the caller and must outlive this schema (see
// createValidationFailureRecorder's lifetime note) — schemas are rebuilt per
// keystroke, so a recorder created here would count keystrokes, not fields.
// Defaults to a no-op for callers without telemetry (tests, the vector check).
const noopRecorder: RecordValidationFailure = () => undefined;

export function createFormSchema(
    fields: ConnectorConfigField[],
    recordFailure: RecordValidationFailure = noopRecorder,
) {
    const schemaShape: Record<string, z.ZodTypeAny> = {};

    for (const field of fields) {
        schemaShape[field.key] = createFieldSchema(field, recordFailure);
    }

    return z.object(schemaShape);
}
