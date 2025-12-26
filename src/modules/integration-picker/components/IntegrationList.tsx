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
    Typography,
} from '@stackone/malachite';
import { useCallback, useMemo } from 'react';
import { CATEGORIES_WITH_LABELS } from '../../../shared/categories';
import { Logo } from '../../../shared/components/Logo';
import { isFalconVersion } from '../../../shared/utils/utils';
import { Integration } from '../types';

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
                {isFalconVersion(integration.version) && (
                    <Typography.SecondaryText>{integration.version}</Typography.SecondaryText>
                )}
            </Flex>
            <Typography.SecondaryText>
                {CATEGORIES_WITH_LABELS.find((category) => category.value === integration.type)
                    ?.label || integration.type}
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
    const visibleIntegrationsForFilters = useMemo(() => {
        return integrations.filter((integration) => integration.active && integration.name);
    }, [integrations]);

    const availableCategories = useMemo(() => {
        return Array.from(new Set(visibleIntegrationsForFilters.map((integration) => integration.type)));
    }, [visibleIntegrationsForFilters]);

    const effectiveSelectedCategory = useMemo(() => {
        return selectedCategory && availableCategories.includes(selectedCategory)
            ? selectedCategory
            : null;
    }, [selectedCategory, availableCategories]);

    const handleCategoryClick = useCallback(
        (category: string) => {
            if (effectiveSelectedCategory === category) {
                onCategoryChange(null);
            } else {
                onCategoryChange(category);
            }
        },
        [effectiveSelectedCategory, onCategoryChange],
    );

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
                                        <div
                                            style={
                                                effectiveSelectedCategory === category
                                                    ? {
                                                          borderRadius: 9999,
                                                          boxShadow:
                                                              '0 0 0 2px var(--malachite-primary, #2d72d9)',
                                                          background:
                                                              'rgba(45, 114, 217, 0.10)',
                                                      }
                                                    : undefined
                                            }
                                        >
                                            <PillButton
                                                label={
                                                    CATEGORIES_WITH_LABELS.find(
                                                        (c) => c.value === category,
                                                    )?.label || category
                                                }
                                                selected={effectiveSelectedCategory === category}
                                                onClick={() => handleCategoryClick(category)}
                                            />
                                        </div>
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
    const effectiveSelectedCategory = useMemo(() => {
        if (!selectedCategory) return null;
        const availableCategories = new Set(
            integrations
                .filter((integration) => integration.active && integration.name)
                .map((integration) => integration.type),
        );
        return availableCategories.has(selectedCategory) ? selectedCategory : null;
    }, [integrations, selectedCategory]);

    const availableIntegrations = useMemo(() => {
        return integrations.filter(
            (integration) =>
                integration.active &&
                integration.name &&
                (effectiveSelectedCategory ? integration.type === effectiveSelectedCategory : true) &&
                (search ? integration.name.toLowerCase().includes(search.toLowerCase()) : true),
        );
    }, [integrations, effectiveSelectedCategory, search]);

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
