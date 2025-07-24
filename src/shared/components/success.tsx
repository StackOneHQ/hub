import {
    CustomIcons,
    Flex,
    FlexAlign,
    FlexDirection,
    FlexGapSize,
    FlexJustify,
    Typography,
    getCurrentTheme,
} from '@stackone/malachite';

interface SuccessProps {
    integrationName: string;
}

const Success: React.FC<SuccessProps> = ({ integrationName }) => {
    const theme = getCurrentTheme();
    return (
        <Flex
            justify={FlexJustify.Center}
            align={FlexAlign.Center}
            direction={FlexDirection.Vertical}
            gapSize={FlexGapSize.Small}
            fullHeight
        >
            <CustomIcons.CheckCircleFilled
                size={16}
                style={{ color: theme.colors.success.foreground }}
            />
            <Typography.Text fontWeight="bold" size="large">
                Connection Successful
            </Typography.Text>
            <Typography.SecondaryText>
                Account successfully connected to {integrationName}
            </Typography.SecondaryText>
        </Flex>
    );
};

export default Success;
