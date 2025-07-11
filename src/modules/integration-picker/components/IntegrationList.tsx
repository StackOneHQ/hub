import {
    ButtonList,
    Flex,
    FlexAlign,
    FlexDirection,
    FlexGapSize,
    FlexJustify,
    Padded,
    Typography,
} from '@stackone/malachite';
import { CATEGORIES_WITH_LABELS } from '../../../shared/categories';
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
    return (
        <>
            <Padded vertical="medium" horizontal="small" fullHeight={false}>
                <Typography.SecondaryText>Select integration</Typography.SecondaryText>
            </Padded>
            <ButtonList
                buttons={integrations
                    ?.filter((integration) => integration.active && integration.name)
                    .map((integration) => ({
                        key: integration.provider,
                        children: <IntegrationRow integration={integration} />,
                        onClick: () => onSelect(integration),
                    }))}
            />
        </>
    );
};
