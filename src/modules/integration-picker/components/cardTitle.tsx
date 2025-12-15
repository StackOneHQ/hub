import {
    Button,
    Flex,
    FlexAlign,
    FlexDirection,
    FlexGapSize,
    FlexJustify,
    Typography,
} from '@stackone/malachite';
import { Logo } from '../../../shared/components/Logo';
import { ConnectorConfig } from '../types';

interface CardTitleProps {
    connectorData: ConnectorConfig;
    onBack?: () => void;
    guide?: { supportLink?: string; description: string };
}

const CardTitle: React.FC<CardTitleProps> = ({ connectorData, onBack, guide }) => {
    console.log(connectorData.assets?.icon);
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
                <Logo
                    src={connectorData.assets?.icon}
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
