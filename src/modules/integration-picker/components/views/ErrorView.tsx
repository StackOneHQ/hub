import {
    Flex,
    FlexAlign,
    FlexDirection,
    FlexGapSize,
    FlexJustify,
    Typography,
} from '@stackone/malachite';
import React from 'react';

interface ErrorViewProps {
    message: string;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ message }) => {
    return (
        <Flex
            justify={FlexJustify.Center}
            align={FlexAlign.Center}
            direction={FlexDirection.Vertical}
            gapSize={FlexGapSize.Small}
            fullHeight
        >
            <Typography.Text size="medium" fontWeight="semi-bold">
                {message}
            </Typography.Text>
        </Flex>
    );
};
