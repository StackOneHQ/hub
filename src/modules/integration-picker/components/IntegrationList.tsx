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
import { useCallback, useMemo, useState } from 'react';
import { CATEGORIES_WITH_LABELS } from '../../../shared/categories';
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
                <img
                    src={`https://app.stackone.com/assets/logos/${integration.provider}.png`}
                    alt={integration.provider}
                    style={{ width: '24px', height: '24px' }}
                />
                <Typography.Text>{integration.name ?? 'N/A'}</Typography.Text>
            </Flex>
            {isFalconVersion(integration.version) && (
                <Typography.SecondaryText>{integration.version}</Typography.SecondaryText>
            )}
            <Typography.SecondaryText>
                {
                    CATEGORIES_WITH_LABELS.find((category) => category.value === integration.type)
                        ?.label
                }
            </Typography.SecondaryText>
        </Flex>
    );
};

export const IntegrationList: React.FC<{
    integrations: Integration[];
    onSelect: (integration: Integration) => void;
}> = ({ integrations, onSelect }) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const [search, setSearch] = useState<string>('');

    const handleCategoryClick = useCallback(
        (category: string) => {
            if (selectedCategory === category) {
                setSelectedCategory(null);
            } else {
                setSelectedCategory(category);
            }
        },
        [selectedCategory],
    );

    const availableIntegrations = useMemo(() => {
        return integrations.filter(
            (integration) =>
                integration.active &&
                integration.name &&
                (selectedCategory ? integration.type === selectedCategory : true) &&
                (search ? integration.name.toLowerCase().includes(search.toLowerCase()) : true),
        );
    }, [integrations, selectedCategory, search]);

    const availableCategories = useMemo(() => {
        return Array.from(new Set(integrations.map((integration) => integration.type)));
    }, [integrations]);

    return (
        <>
            <Input
                name="search"
                placeholder="Search Integrations"
                variant="ghost"
                size="large"
                onChange={setSearch}
            />
            <Divider />
            <Padded vertical="small" horizontal="medium" fullHeight={false}>
                <Spacer direction="horizontal" size={4} align="start">
                    {availableCategories.length > 1 &&
                        availableCategories.map((category) => (
                            <PillButton
                                key={category}
                                label={
                                    CATEGORIES_WITH_LABELS.find((c) => c.value === category)
                                        ?.label || category
                                }
                                selected={selectedCategory === category}
                                onClick={() => handleCategoryClick(category)}
                            />
                        ))}
                </Spacer>
            </Padded>
            <Divider />
            {availableIntegrations.length > 0 ? (
                <Padded vertical="small" horizontal="small" fullHeight={true}>
                    <Spacer direction="vertical" size={10} align="start">
                        <Padded vertical="none" horizontal="small">
                            <Typography.SecondaryText className="text-left">
                                Add integration
                            </Typography.SecondaryText>
                        </Padded>
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
