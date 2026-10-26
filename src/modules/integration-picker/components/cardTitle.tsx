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
    Typography,
} from '@stackone/malachite';
import { ConnectorConfig } from '../types';
import { CancelButton } from './cancelButton';

interface CardTitleProps {
    connectorData: ConnectorConfig;
    onBack?: () => void;
    onCancel?: () => void;
    guide?: { supportLink?: string | null; description?: string | null };
    profileOptions?: DropdownItem[];
    selectedProfileId?: string;
    onProfileChange?: (integrationId: string) => void;
}

const CardTitle: React.FC<CardTitleProps> = ({
    connectorData,
    onBack,
    onCancel,
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
            >
                {onBack && <Button variant="ghost" onClick={onBack} icon="←" size="small" />}
                <Avatar
                    src={connectorData.assets?.icon}
                    name={connectorData.key}
                    size={16}
                    fallback="placeholder"
                />
                <Typography.Text fontWeight="semi-bold" size="medium">
                    {connectorData.name}
                </Typography.Text>
            </Flex>
            <Flex
                direction={FlexDirection.Horizontal}
                align={FlexAlign.Center}
                gapSize={FlexGapSize.Small}
                justify={FlexJustify.Right}
            >
                {guide?.supportLink ? (
                    <Typography.LinkText href={guide.supportLink} target="_blank">
                        <Button variant="outline" size="small">
                            Connection guide
                        </Button>
                    </Typography.LinkText>
                ) : null}
                {profileOptions && profileOptions.length > 0 && (
                    <>
                        <Typography.SecondaryText>Connector profile</Typography.SecondaryText>
                        <Dropdown
                            name="connector-profile"
                            aria-label="Connector profile"
                            size="small"
                            minWidth={400}
                            menuAlign="end"
                            items={profileOptions}
                            value={selectedProfileId}
                            onItemSelected={(id) => id && onProfileChange?.(id)}
                        />
                    </>
                )}
                {onCancel && <CancelButton onClick={onCancel} />}
            </Flex>
        </Flex>
    );
};

export default CardTitle;
