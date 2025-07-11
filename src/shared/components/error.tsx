import {
    CustomIcons,
    Flex,
    FlexAlign,
    FlexDirection,
    FlexGapSize,
    FlexJustify,
    Typography,
    useTheme,
} from '@stackone/malachite';

const ErrorContainer: React.FC = () => {
    const { colors } = useTheme();
    return (
        <Flex
            justify={FlexJustify.Center}
            align={FlexAlign.Center}
            direction={FlexDirection.Vertical}
            gapSize={FlexGapSize.Small}
            fullHeight
        >
            <CustomIcons.RejectIcon style={{ color: colors.redForeground }} />
            <Typography.Text fontWeight="bold" size="large">
                Error
            </Typography.Text>
            <Typography.SecondaryText>
                Something went wrong, our team has been notified.
            </Typography.SecondaryText>
        </Flex>
    );
};

export default ErrorContainer;
