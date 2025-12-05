import {
    Button,
    Flex,
    FlexAlign,
    FlexDirection,
    FlexGapSize,
    FlexJustify,
    Typography,
} from '@stackone/malachite';
import { ConnectorConfig } from '../types';

interface CardTitleProps {
    connectorData: ConnectorConfig;
    onBack?: () => void;
    guide?: { supportLink?: string; description: string };
}

const CardTitle: React.FC<CardTitleProps> = ({ connectorData, onBack, guide }) => {
    return (
        <Flex
            direction={FlexDirection.Horizontal}
            align={FlexAlign.Center}
            gapSize={FlexGapSize.Small}
            justify={FlexJustify.SpaceBetween}
        >
            <Flex
                direction={FlexDirection.Horizontal}
                align={FlexAlign.Center}
                gapSize={FlexGapSize.Small}
                justify={FlexJustify.Left}
            >
                {onBack && <Button variant="ghost" onClick={onBack} icon="←" size="small" />}
                <img
                    src={`https://app.stackone.com/assets/logos/${connectorData.key}.png`}
                    alt={connectorData.key}
                    style={{ width: '16px', height: '16px' }}
                />
                <Typography.Text fontWeight="semi-bold" size="medium">
                    {connectorData.name}
                </Typography.Text>
            </Flex>
            {guide?.supportLink && (
                <Typography.LinkText href={guide?.supportLink} target="_blank">
                    <Button variant="outline" size="small">
                        Connection guide
                    </Button>
                </Typography.LinkText>
            )}
        </Flex>
    );
};

export default CardTitle;
