export interface Integration {
    active: boolean;
    name: string;
    provider: string;
    type: string;
    version: string;
    authentication_config_key: string;
    environment: string;
    integration_id: string;
    logo_url: string;
}

export interface HubData {
    integrations: Array<Integration>;
    external_trigger_token?: string;
    webhooks_url?: string;
    events_encoded_context?: string;
}

// V2/legacy TS connectors — always discriminated by the required `type` on the wire; message field is `error`
export interface LegacyFieldValidation {
    type: 'html-pattern' | 'domain';
    pattern: string;
    error?: string;
    format?: never;
    errorMessage?: never;
}

// Local copy of the format names from `@stackone/core`'s `InputFormat` (connect repo,
// `packages/core/src/connector/types.ts`) — the hub deliberately carries no @stackone
// package dependencies for this feature; keep in sync when a format is added. The
// FORMAT_PATTERNS copy in utils/zodSchema.ts and the vector check in
// scripts/check-format-vectors.ts guard the regexes themselves.
export type FormatName = 'email' | 'url' | 'uuid' | 'date' | 'datetime' | 'uri';

// Falcon connectors — no `type`; exactly one of pattern/format is set (XOR), message
// field is `errorMessage`. Local copy of `AuthenticationFieldValidation` from
// `@stackone/core` (connect repo) — keep in sync if the authoring contract changes.
export type FalconFieldValidation =
    | { type?: never; error?: never; pattern: string; format?: never; errorMessage?: string }
    | { type?: never; error?: never; format: FormatName; pattern?: never; errorMessage?: string };

export type FieldValidation = LegacyFieldValidation | FalconFieldValidation;

export interface ConnectorConfigField {
    type?: 'text' | 'password' | 'number' | 'select' | 'text_area';
    label: string;
    key: string;
    required: boolean;
    readOnly: boolean;
    secret: boolean;
    placeholder: string;
    options?: Array<{
        label: string;
        value: string;
    }>;
    description?: string;
    tooltip?: string;
    guide?: {
        description: string;
        tooltip: string;
    };
    value?: string | number;
    condition?: string;
    validation?: FieldValidation;
    display?: boolean;
}

export interface LegacyConnectorConfig {
    key: string;
    name: string;
    assets?: {
        icon: string;
    };
    authentication: {
        [authKey: string]: {
            [environment: string]: {
                fields: Array<ConnectorConfigField>;
                guide?: {
                    supportLink?: string;
                    description: string;
                };
                type: 'oauth2' | 'oidc' | 'custom';
            };
        };
    };
}

type AuthenticationNoticeTop = {
    key: string;
    type: 'warning' | 'info';
    description: string;
    position?: 'top';
    anchor?: string;
};

type AuthenticationNoticeBottom = {
    key: string;
    type: 'warning' | 'info';
    description: string;
    position: 'bottom';
};

export type AuthenticationNotice = AuthenticationNoticeTop | AuthenticationNoticeBottom;

export function hasAnchor(
    notice: AuthenticationNotice,
): notice is AuthenticationNoticeTop & { anchor: string } {
    return (
        'anchor' in notice && typeof notice.anchor === 'string' && notice.anchor.trim().length > 0
    );
}

export interface FalconConnectorConfig {
    key: string;
    name: string;
    type: 'oauth2' | 'custom';
    grantType?: 'authorization_code' | 'client_credentials';
    configFields?: Array<ConnectorConfigField>;
    configNotices?: Array<AuthenticationNotice>;
    assets?: {
        icon: string;
    };
    /**
     * Optional "connection guide" support information.
     * Some existing/custom connectors may omit this entirely.
     */
    support?: {
        link?: string | null;
        description?: string | null;
    } | null;
}

export type ConnectorConfig = LegacyConnectorConfig | FalconConnectorConfig;

export interface HubConnectorConfig {
    config: ConnectorConfig;
    hub_settings: {
        configured_webhook_events: Record<string, Set<string>>;
        project_settings: Record<string, string | object>;
    };
}

// Type guards for safe type checking - using structural properties instead of explicit type field
export function isLegacyConnectorConfig(config: ConnectorConfig): config is LegacyConnectorConfig {
    return 'authentication' in config && !('configFields' in config);
}

export function isFalconConnectorConfig(config: ConnectorConfig): config is FalconConnectorConfig {
    return ('configFields' in config || 'configNotices' in config) && !('authentication' in config);
}

export interface AccountData {
    secureId: string;
    provider: string;
    setupInformation: Record<string, string>;
    secrets?: Record<string, string>;
    version: string;
    authConfigKey?: string;
    environment?: string;
    integrationId: string;
}

export interface AccountCreationResponse {
    id: string;
    provider: string;
}
