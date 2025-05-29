import {
    Button,
    ButtonList,
    Flex,
    FlexAlign,
    FlexDirection,
    FlexGapSize,
    FlexJustify,
    Padded,
    Spacer,
    Typography,
} from '@stackone/malachite';
import { Integration } from '../types';
import { CATEGORIES_WITH_LABELS } from '../../../shared/categories';

interface IntegrationRowProps {
    integration: Integration;
    onClick?: (integration: Integration) => void;
}

const IntegrationRow: React.FC<IntegrationRowProps> = ({ integration, onClick }) => {
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

export const IntegrationSelector: React.FC<{
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
                        children: (
                            <IntegrationRow
                                integration={integration}
                                onClick={(selectedIntegration) => onSelect(selectedIntegration)}
                            />
                        ),
                        onClick: () => onSelect(integration),
                    }))}
            />
        </>
    );
};
