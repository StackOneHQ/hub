import {
    Button,
    Card,
    CustomIcons,
    Flex,
    FlexAlign,
    FlexDirection,
    FlexGapSize,
    FlexJustify,
    Padded,
    Spacer,
    Table,
    Tag,
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
        <Card border="rounded" padding="16px" width="100%">
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
                    <Tag
                        value={integration.active ? 'Enabled' : 'Disabled'}
                        type={integration.active ? 'success' : 'default'}
                    />
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

            {/* Row 2: Auth type + Version */}
            <div style={{ marginTop: '12px' }}>
                <Flex
                    direction={FlexDirection.Horizontal}
                    align={FlexAlign.Center}
                    justify={FlexJustify.Left}
                    gapSize={FlexGapSize.Small}
                >
                    <Tag
                        value={
                            integration.authentication_config_label ??
                            getAuthTypeLabel(integration.authentication_config_key)
                        }
                        type="default"
                        textTransform="none"
                    />
                    <Typography.SecondaryText>
                        Version {integration.version}
                    </Typography.SecondaryText>
                </Flex>
            </div>

            {/* Row 3: Stats */}
            <div style={{ marginTop: '12px' }}>
                <Typography.SecondaryText>
                    {actionsCount} {actionsCount === 1 ? 'action' : 'actions'} &middot;{' '}
                    {accountCount} {accountCount === 1 ? 'account' : 'accounts'}
                </Typography.SecondaryText>
            </div>

            {/* Expanded: Actions table */}
            {expanded && hasActions && (
                <>
                    <div style={{ marginTop: '20px' }}>
                        <Typography.Text fontWeight="semi-bold" size="small">
                            Actions {actionsCount}
                        </Typography.Text>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                        <Table
                            size="small"
                            bordered
                            layout="fixed"
                            rowKey="id"
                            columns={[
                                {
                                    title: 'Name',
                                    dataIndex: 'name',
                                    key: 'name',
                                    width: '40%',
                                },
                                {
                                    title: 'Description',
                                    dataIndex: 'description',
                                    key: 'description',
                                    width: '60%',
                                    render: (value: unknown) => {
                                        const description = value as string;
                                        return description ? (
                                            <Typography.EllipsisText
                                                tooltip={description}
                                                maxWidth="100%"
                                            >
                                                {description}
                                            </Typography.EllipsisText>
                                        ) : (
                                            '\u2014'
                                        );
                                    },
                                },
                            ]}
                            data={(integration.actions ?? []).map((action) => ({
                                id: action.id ?? action.name,
                                name: action.name,
                                description: action.description ?? '',
                            }))}
                        />
                    </div>
                </>
            )}
        </Card>
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
        <Padded vertical="medium" horizontal="medium" fullHeight={false}>
            <Spacer direction="vertical" size={16} fullWidth align="start">
                <Flex
                    direction={FlexDirection.Horizontal}
                    align={FlexAlign.Center}
                    justify={FlexJustify.SpaceBetween}
                    width="100%"
                    gapSize={FlexGapSize.Small}
                >
                    <Typography.SecondaryText>
                        Select an existing auth config to link an account, or create a new one.
                    </Typography.SecondaryText>
                    {onCreateNew && (
                        <Button
                            variant="outline"
                            size="small"
                            icon={<CustomIcons.PlusIcon size={14} />}
                            onClick={onCreateNew}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            Create New Auth Config
                        </Button>
                    )}
                </Flex>
                <Spacer direction="vertical" size={12} fullWidth>
                    {integrations.map((integration) => (
                        <AuthConfigCard
                            key={integration.integration_id}
                            integration={integration}
                            onSelect={onSelect}
                        />
                    ))}
                </Spacer>
            </Spacer>
        </Padded>
    );
};
