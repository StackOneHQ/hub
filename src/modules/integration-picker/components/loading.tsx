import {
    Flex,
    FlexAlign,
    FlexDirection,
    FlexGapSize,
    FlexJustify,
    Spinner,
    Typography,
} from '@stackone/malachite';

export const Loading: React.FC<{
    title: string;
    description: string;
}> = ({ title, description }) => {
    return (
        <Flex
            justify={FlexJustify.Center}
            align={FlexAlign.Center}
            direction={FlexDirection.Vertical}
            gapSize={FlexGapSize.Small}
            fullHeight
        >
            <Spinner size="xxxsmall" />
            <Typography.Text fontWeight="bold" size="large">
                {title}
            </Typography.Text>
            <Typography.SecondaryText>{description}</Typography.SecondaryText>
        </Flex>
    );
};
