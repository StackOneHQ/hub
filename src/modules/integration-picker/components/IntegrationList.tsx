import {
    ButtonList,
    Divider,
    Flex,
    FlexAlign,
    FlexDirection,
    FlexGapSize,
    FlexJustify,
    Input,
    Padded,
    PillButton,
    Spacer,
    TruncatedTooltip,
    Typography,
} from '@stackone/malachite';
import { useCallback, useMemo } from 'react';
import { formatConnectorCategoryLabel, getConnectorCategoryKey } from '../../../shared/categories';
import { Logo } from '../../../shared/components/Logo';
import { Integration } from '../types';

// The list renders only these, so the filter chips must be built from the same set:
// a category carried only by inactive connectors would otherwise offer an empty filter.
const isSelectable = (integration: Integration): boolean =>
    Boolean(integration.active && integration.name);

interface IntegrationRowProps {
    integration: Integration;
}

const IntegrationRow: React.FC<IntegrationRowProps> = ({ integration }) => {
    return (
        <Flex
            direction={FlexDirection.Horizontal}
            align={FlexAlign.Center}
            gapSize={FlexGapSize.Small}
            justify={FlexJustify.SpaceBetween}
            width="100%"
        >
            <Flex
                direction={FlexDirection.Horizontal}
                align={FlexAlign.Center}
                gapSize={FlexGapSize.Small}
                justify={FlexJustify.Left}
                width="100%"
            >
                <Logo
                    src={integration.logo_url}
                    alt={integration.provider}
                    style={{ width: '24px', height: '24px' }}
                />
                <Typography.Text textAlign="left">{integration.name ?? 'N/A'}</Typography.Text>
            </Flex>
            {/* Capped because a provider-defined category can be arbitrarily long. The
                dimmed colour sits outside the tooltip so the ellipsis inherits it too. */}
            <Typography.SecondaryText style={{ maxWidth: '45%', flexShrink: 0 }}>
                <TruncatedTooltip text={formatConnectorCategoryLabel(integration.type)}>
                    {formatConnectorCategoryLabel(integration.type)}
                </TruncatedTooltip>
            </Typography.SecondaryText>
        </Flex>
    );
};

export const IntegrationListHeader: React.FC<{
    integrations: Integration[];
    selectedCategory: string | null;
    onCategoryChange: (category: string | null) => void;
    onSearchChange: (search: string) => void;
}> = ({ integrations, selectedCategory, onCategoryChange, onSearchChange }) => {
    const handleCategoryClick = useCallback(
        (category: string) => {
            if (selectedCategory === category) {
                onCategoryChange(null);
            } else {
                onCategoryChange(category);
            }
        },
        [selectedCategory, onCategoryChange],
    );

    const availableCategories = useMemo(() => {
        return Array.from(
            new Set(
                integrations
                    .filter(isSelectable)
                    .map((integration) => getConnectorCategoryKey(integration.type)),
            ),
        );
    }, [integrations]);

    return (
        <>
            <Input
                name="search"
                placeholder="Search Integrations"
                variant="ghost"
                size="large"
                onChange={onSearchChange}
            />
            {availableCategories.length > 1 && (
                <>
                    <Divider />
                    <Padded vertical="small" horizontal="none" fullHeight={false}>
                        <div
                            style={{
                                overflowX: 'auto',
                                overflowY: 'hidden',
                                backgroundColor: 'var(--malachite-card-background)',
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                            }}
                            className="hide-scrollbar"
                        >
                            <div style={{ display: 'flex', minWidth: 'max-content' }}>
                                {availableCategories.map((category) => (
                                    <Padded
                                        key={category}
                                        vertical="none"
                                        horizontal="small"
                                        fullHeight={false}
                                    >
                                        <PillButton
                                            label={formatConnectorCategoryLabel(category)}
                                            selected={selectedCategory === category}
                                            onClick={() => handleCategoryClick(category)}
                                        />
                                    </Padded>
                                ))}
                            </div>
                        </div>
                    </Padded>
                </>
            )}
        </>
    );
};

export const IntegrationList: React.FC<{
    integrations: Integration[];
    onSelect: (integration: Integration) => void;
    selectedCategory: string | null;
    search: string;
}> = ({ integrations, onSelect, selectedCategory, search }) => {
    const availableIntegrations = useMemo(() => {
        return integrations.filter(
            (integration) =>
                isSelectable(integration) &&
                (selectedCategory
                    ? getConnectorCategoryKey(integration.type) === selectedCategory
                    : true) &&
                (search ? integration.name.toLowerCase().includes(search.toLowerCase()) : true),
        );
    }, [integrations, selectedCategory, search]);

    return (
        <>
            {availableIntegrations.length > 0 ? (
                <Padded vertical="small" horizontal="small" fullHeight={false}>
                    <Spacer direction="vertical" size={10} align="start">
                        <ButtonList
                            buttons={availableIntegrations.map((integration) => ({
                                key: `${integration.provider}@${integration.version}`,
                                children: <IntegrationRow integration={integration} />,
                                onClick: () => onSelect(integration),
                            }))}
                        />
                    </Spacer>
                </Padded>
            ) : (
                <Flex justify={FlexJustify.Center} align={FlexAlign.Center} fullHeight={true}>
                    <Typography.SecondaryText>No integrations found</Typography.SecondaryText>
                </Flex>
            )}
        </>
    );
};
