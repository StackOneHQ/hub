import type { ConnectorConfigField } from '../types';
import { isSecretPlaceholder } from './secretPlaceholder';

export type CredentialsPayload = Record<string, string | null>;

const isSecretField = (field: ConnectorConfigField) =>
    field.secret !== false || field.type === 'password';

const untouchedSecretKeys = (
    formData: Record<string, string>,
    fields: ConnectorConfigField[],
    editingSecrets: Set<string>,
) =>
    new Set(
        fields
            .filter(
                (field) =>
                    isSecretField(field) &&
                    isSecretPlaceholder(formData[field.key]) &&
                    !editingSecrets.has(field.key),
            )
            .map((field) => field.key),
    );

const clearedKeys = (
    formData: Record<string, string>,
    fields: ConnectorConfigField[],
    storedSetupInformation: Record<string, string>,
) =>
    new Set(
        fields
            .filter(
                (field) =>
                    !isSecretField(field) &&
                    formData[field.key] === '' &&
                    !!storedSetupInformation[field.key],
            )
            .map((field) => field.key),
    );

/**
 * A field the form showed with its stored value and the user emptied is sent as `null`, so the
 * API removes it. Secrets are never cleared this way: opening one empties it before any typing.
 */
export const buildCredentialsPayload = ({
    formData,
    fields,
    editingSecrets,
    storedSetupInformation,
}: {
    formData: Record<string, string>;
    fields: ConnectorConfigField[];
    editingSecrets: Set<string>;
    storedSetupInformation?: Record<string, string>;
}): CredentialsPayload => {
    const keptSecrets = storedSetupInformation
        ? untouchedSecretKeys(formData, fields, editingSecrets)
        : new Set<string>();
    const cleared = clearedKeys(formData, fields, storedSetupInformation ?? {});

    return Object.fromEntries(
        Object.entries(formData)
            .filter(([key, value]) => !keptSecrets.has(key) && (value !== '' || cleared.has(key)))
            .map(([key, value]) => [key, cleared.has(key) ? null : value]),
    );
};

export const withoutClearedFields = (credentials: CredentialsPayload): Record<string, string> =>
    Object.fromEntries(
        Object.entries(credentials).filter((entry): entry is [string, string] => entry[1] !== null),
    );
