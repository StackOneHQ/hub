export interface Integration {
    active: boolean;
    name: string;
    provider: string;
    type: string;
    version: string;
    authentication_config_key: string;
    environment: string;
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
}

export interface ConnectorConfig {
    key: string;
    name: string;
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

export interface HubConnectorConfig {
    config: ConnectorConfig;
    hub_settings: {
        configured_webhook_events: Record<string, Set<string>>;
        project_settings: Record<string, string | object>;
    };
}

export interface AccountData {
    account_id: string;
    provider: string;
    setupInformation: Record<string, string>;
}
