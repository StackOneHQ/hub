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

const emptiedKeys = (formData: Record<string, string>, fields: ConnectorConfigField[]) =>
    new Set(
        fields
            .filter((field) => !isSecretField(field) && !!field.value && formData[field.key] === '')
            .map((field) => field.key),
    );

/**
 * On an edit, a field the form showed with a value and the user emptied is sent as `null`, so
 * the API removes it. Secrets are never cleared this way: opening one empties it before any typing.
 */
export const buildCredentialsPayload = ({
    formData,
    fields,
    editingSecrets,
    editing,
}: {
    formData: Record<string, string>;
    fields: ConnectorConfigField[];
    editingSecrets: Set<string>;
    editing: boolean;
}): CredentialsPayload => {
    const keptSecrets = editing ? untouchedSecretKeys(formData, fields, editingSecrets) : new Set();
    const cleared = editing ? emptiedKeys(formData, fields) : new Set();

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
