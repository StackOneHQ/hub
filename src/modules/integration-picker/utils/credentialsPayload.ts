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
    fields
        .filter(
            (field) =>
                isSecretField(field) &&
                isSecretPlaceholder(formData[field.key]) &&
                !editingSecrets.has(field.key),
        )
        .map((field) => field.key);

/**
 * An edit sends a cleared field as `null` so the API removes the stored value; a new account
 * has nothing stored, so it simply omits the field.
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
    const keptSecrets = editing ? untouchedSecretKeys(formData, fields, editingSecrets) : [];

    return Object.fromEntries(
        Object.entries(formData)
            .filter(([key, value]) => !keptSecrets.includes(key) && (editing || value !== ''))
            .map(([key, value]) => [key, value === '' ? null : value]),
    );
};

export const withoutClearedFields = (credentials: CredentialsPayload): Record<string, string> =>
    Object.fromEntries(
        Object.entries(credentials).filter((entry): entry is [string, string] => entry[1] !== null),
    );
