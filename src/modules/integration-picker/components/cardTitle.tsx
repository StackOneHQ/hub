import {
    Avatar,
    Button,
    Flex,
    FlexAlign,
    FlexDirection,
    FlexGapSize,
    FlexJustify,
    InfoIcon,
    Typography,
} from '@stackone/malachite';
import { ConnectorConfig } from '../types';
import { HeaderCloseButton } from './headerCloseButton';

interface CardTitleProps {
    connectorData: ConnectorConfig;
    onBack?: () => void;
    onClose?: () => void;
    guide?: { supportLink?: string | null; description?: string | null };
}

const CardTitle: React.FC<CardTitleProps> = ({ connectorData, onBack, onClose, guide }) => {
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
                shrink
            >
                {onBack && <Button variant="ghost" onClick={onBack} icon="←" size="small" />}
                <Avatar
                    src={connectorData.assets?.icon}
                    name={connectorData.key}
                    size={16}
                    fallback="placeholder"
                />
                <Typography.EllipsisText
                    fontWeight="semi-bold"
                    size="medium"
                    tooltip={connectorData.name}
                    tooltipPlacement="bottom"
                    tooltipWhenTruncated
                >
                    {connectorData.name}
                </Typography.EllipsisText>
            </Flex>
            <Flex
                direction={FlexDirection.Horizontal}
                align={FlexAlign.Center}
                gapSize={FlexGapSize.Small}
                justify={FlexJustify.Right}
            >
                {guide?.supportLink ? (
                    <Button
                        variant="ghost"
                        size="small"
                        href={guide.supportLink}
                        target="_blank"
                        aria-label="Connection guide"
                        tooltip="Connection guide"
                        tooltipPlacement="bottom"
                        icon={<InfoIcon size={18} />}
                        iconOnly
                    />
                ) : null}
                {onClose && <HeaderCloseButton onClick={onClose} />}
            </Flex>
        </Flex>
    );
};

export default CardTitle;
