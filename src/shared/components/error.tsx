import {
    CustomIcons,
    Flex,
    FlexAlign,
    FlexDirection,
    FlexGapSize,
    FlexJustify,
    Typography,
} from '@stackone/malachite';

const ErrorContainer: React.FC = () => {
    return (
        <Flex
            justify={FlexJustify.Center}
            align={FlexAlign.Center}
            direction={FlexDirection.Vertical}
            gapSize={FlexGapSize.Small}
            fullHeight
        >
            {/* TODO: fix */}
            <CustomIcons.RejectIcon style={{ color: 'red' }} />
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
