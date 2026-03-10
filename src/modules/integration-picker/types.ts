export interface IntegrationAction {
    name: string;
    url?: string;
}

export interface Integration {
    active: boolean;
    name: string;
    provider: string;
    type: string;
    version: string;
    authentication_config_key: string;
    authentication_config_label?: string | null;
    environment: string;
    integration_id: string;
    logo_url: string;
    connector_name?: string;
    account_count?: number;
    actions_count?: number;
    triggers_count?: number;
    actions?: IntegrationAction[];
}

export interface HubData {
    integrations: Array<Integration>;
    external_trigger_token?: string;
}

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
    guide?: {
        description: string;
        tooltip: string;
    };
    value?: string | number;
    condition?: string;
    validation?: {
        type: 'html-pattern' | 'domain';
        pattern: string;
        error?: string;
    };
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

export interface FalconConnectorConfig {
    key: string;
    name: string;
    type: 'oauth2' | 'custom';
    grantType?: 'authorization_code' | 'client_credentials';
    configFields: Array<ConnectorConfigField>;
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
    return 'configFields' in config && !('authentication' in config);
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

export interface ProviderActionMeta {
    id?: string;
    key?: string;
    name: string;
    description?: string;
}

export interface ProviderActionsResponse {
    key: string;
    version: string;
    name?: string;
    actions?: ProviderActionMeta[];
    actions_count?: number;
}

export interface AccountCreationResponse {
    id: string;
    provider: string;
}
