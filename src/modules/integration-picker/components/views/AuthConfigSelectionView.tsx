import {
    Button,
    CustomIcons,
    Flex,
    FlexAlign,
    FlexDirection,
    FlexGapSize,
    FlexJustify,
    Padded,
    Typography,
} from '@stackone/malachite';
import React, { useState } from 'react';
import { Integration } from '../../types';

const AUTH_TYPE_LABELS: Record<string, string> = {
    api_key: 'API Key',
    oauth2: 'OAuth',
    oauth: 'OAuth',
    bearer: 'Bearer',
    basic: 'Basic Auth',
    saml: 'SAML',
    oidc: 'OIDC',
    custom: 'Custom',
};

function getAuthTypeLabel(key: string): string {
    if (!key) return 'Unknown';
    return (
        AUTH_TYPE_LABELS[key.toLowerCase()] ||
        key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    );
}

const statusBadgeStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 500,
    backgroundColor: active ? '#dcfce7' : '#f3f4f6',
    color: active ? '#166534' : '#6b7280',
    whiteSpace: 'nowrap',
});

const authTypeBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    border: '1px solid var(--malachite-border-color, #e5e7eb)',
    backgroundColor: 'var(--malachite-card-background, #fff)',
};

const cardStyle: React.CSSProperties = {
    border: '1px solid var(--malachite-border-color, #e5e7eb)',
    borderRadius: '8px',
    padding: '16px',
    width: '100%',
    boxSizing: 'border-box',
};

const tabActiveStyle: React.CSSProperties = {
    padding: '4px 12px',
    borderBottom: '2px solid #000',
    fontWeight: 500,
    fontSize: '14px',
};

interface AuthConfigCardProps {
    integration: Integration;
    onSelect: (integration: Integration) => void;
}

const AuthConfigCard: React.FC<AuthConfigCardProps> = ({ integration, onSelect }) => {
    const [expanded, setExpanded] = useState(false);

    const actionsCount = integration.actions_count ?? integration.actions?.length ?? 0;
    const accountCount = integration.account_count ?? 0;
    const hasActions = integration.actions && integration.actions.length > 0;

    return (
        <div style={cardStyle}>
            {/* Row 1: Name + Status badge + chevron + Select */}
            <Flex
                direction={FlexDirection.Horizontal}
                align={FlexAlign.Center}
                justify={FlexJustify.SpaceBetween}
            >
                <Flex
                    direction={FlexDirection.Horizontal}
                    align={FlexAlign.Center}
                    gapSize={FlexGapSize.Small}
                >
                    <Typography.Text fontWeight="semi-bold">{integration.name}</Typography.Text>
                    <span style={statusBadgeStyle(integration.active)}>
                        {integration.active ? 'Enabled' : 'Disabled'}
                    </span>
                </Flex>
                <Flex
                    direction={FlexDirection.Horizontal}
                    align={FlexAlign.Center}
                    gapSize={FlexGapSize.Small}
                >
                    {hasActions && (
                        <Button
                            variant="ghost"
                            size="small"
                            iconOnly
                            icon={
                                expanded ? (
                                    <CustomIcons.CaretUpIcon size={16} />
                                ) : (
                                    <CustomIcons.CaretDownIcon size={16} />
                                )
                            }
                            onClick={() => setExpanded(!expanded)}
                            aria-label={expanded ? 'Collapse details' : 'Expand details'}
                        />
                    )}
                    <Button variant="filled" size="small" onClick={() => onSelect(integration)}>
                        Select
                    </Button>
                </Flex>
            </Flex>

            {/* Row 2: Auth type + Version (left-aligned) */}
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={authTypeBadgeStyle}>
                    {getAuthTypeLabel(integration.authentication_config_key)}
                </span>
                <Typography.SecondaryText>Version {integration.version}</Typography.SecondaryText>
            </div>

            {/* Row 3: Stats */}
            <div style={{ marginTop: '8px' }}>
                <Typography.SecondaryText>
                    {actionsCount} {actionsCount === 1 ? 'action' : 'actions'} &middot;{' '}
                    {accountCount} {accountCount === 1 ? 'account' : 'accounts'}
                </Typography.SecondaryText>
            </div>

            {/* Expanded: Actions table (only when actions data exists) */}
            {expanded && hasActions && (
                <div style={{ marginTop: '12px' }}>
                    <div
                        style={{
                            display: 'flex',
                            borderBottom: '1px solid var(--malachite-border-color, #e5e7eb)',
                            marginBottom: '8px',
                        }}
                    >
                        <span style={tabActiveStyle}>Actions {actionsCount}</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th
                                    style={{
                                        textAlign: 'left',
                                        padding: '8px 0',
                                        fontSize: '13px',
                                        color: '#6b7280',
                                        fontWeight: 500,
                                    }}
                                >
                                    Name
                                </th>
                                <th
                                    style={{
                                        textAlign: 'right',
                                        padding: '8px 0',
                                        fontSize: '13px',
                                        color: '#6b7280',
                                        fontWeight: 500,
                                    }}
                                >
                                    View
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {integration.actions?.map((action) => (
                                <tr
                                    key={action.name}
                                    style={{
                                        borderTop:
                                            '1px solid var(--malachite-border-color, #f3f4f6)',
                                    }}
                                >
                                    <td style={{ padding: '8px 0', fontSize: '14px' }}>
                                        {action.name}
                                    </td>
                                    <td style={{ textAlign: 'right', padding: '8px 0' }}>
                                        {action.url ? (
                                            <a
                                                href={action.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    color: '#6b7280',
                                                    textDecoration: 'none',
                                                }}
                                            >
                                                &#8599;
                                            </a>
                                        ) : (
                                            <span style={{ color: '#d1d5db' }}>&#8599;</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

interface AuthConfigSelectionViewProps {
    integrations: Integration[];
    onSelect: (integration: Integration) => void;
    onCreateNew?: () => void;
}

export const AuthConfigSelectionView: React.FC<AuthConfigSelectionViewProps> = ({
    integrations,
    onSelect,
    onCreateNew,
}) => {
    return (
        <Padded vertical="small" horizontal="small" fullHeight={false}>
            <div style={{ marginBottom: '16px' }}>
                <Typography.SecondaryText>
                    Select an existing auth config to link an account, or create a new one.
                </Typography.SecondaryText>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                {integrations.map((integration) => (
                    <AuthConfigCard
                        key={integration.integration_id}
                        integration={integration}
                        onSelect={onSelect}
                    />
                ))}
            </div>
            {onCreateNew && (
                <div style={{ marginTop: '16px' }}>
                    <button
                        type="button"
                        onClick={onCreateNew}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid var(--malachite-border-color, #e5e7eb)',
                            borderRadius: '8px',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            color: 'inherit',
                        }}
                    >
                        <span>+</span> Create New Auth Config
                    </button>
                </div>
            )}
        </Padded>
    );
};
