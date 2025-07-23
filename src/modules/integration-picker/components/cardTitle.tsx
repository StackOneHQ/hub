import {
    Button,
    Flex,
    FlexAlign,
    FlexDirection,
    FlexGapSize,
    FlexJustify,
    Typography,
} from '@stackone/malachite';
import { Integration } from '../types';

interface CardTitleProps {
    selectedIntegration: Integration;
    onBack?: () => void;
    guide?: { supportLink?: string; description: string };
}

const CardTitle: React.FC<CardTitleProps> = ({ selectedIntegration, onBack, guide }) => {
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
                    src={`https://app.stackone.com/assets/logos/${selectedIntegration.provider}.png`}
                    alt={selectedIntegration.provider}
                    style={{ width: '24px', height: '24px' }}
                />
                <Typography.Text fontWeight="semi-bold" size="large">
                    {selectedIntegration.name}
                </Typography.Text>
            </Flex>
            {guide?.supportLink && (
                <Typography.LinkText href={guide?.supportLink} target="_blank">
                    <Button variant="outline" size="medium">
                        Connection guide
                    </Button>
                </Typography.LinkText>
            )}
        </Flex>
    );
};

export default CardTitle;
