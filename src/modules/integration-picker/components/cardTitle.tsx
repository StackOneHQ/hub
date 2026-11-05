import {
    Avatar,
    Button,
    Dropdown,
    DropdownItem,
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
    profileOptions?: DropdownItem[];
    selectedProfileId?: string;
    onProfileChange?: (integrationId: string) => void;
}

const CardTitle: React.FC<CardTitleProps> = ({
    connectorData,
    onBack,
    onClose,
    guide,
    profileOptions,
    selectedProfileId,
    onProfileChange,
}) => {
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
                shrink
            >
                {profileOptions && profileOptions.length > 0 && (
                    <>
                        <Typography.SecondaryText>Profile</Typography.SecondaryText>
                        <div style={{ minWidth: 96 }}>
                            <Dropdown
                                name="connector-profile"
                                aria-label="Profile"
                                size="small"
                                minWidth={400}
                                menuAlign="end"
                                items={profileOptions}
                                value={selectedProfileId}
                                onItemSelected={(id) => id && onProfileChange?.(id)}
                            />
                        </div>
                    </>
                )}
                {guide?.supportLink ? (
                    <Button
                        variant="ghost"
                        size="small"
                        href={guide.supportLink}
                        target="_blank"
                        aria-label="Connection guide"
                        tooltip="Connection guide"
                        tooltipPlacement="bottom"
                        icon={<InfoIcon size={16} />}
                        iconOnly
                    />
                ) : null}
                {onClose && <HeaderCloseButton onClick={onClose} />}
            </Flex>
        </Flex>
    );
};

export default CardTitle;
