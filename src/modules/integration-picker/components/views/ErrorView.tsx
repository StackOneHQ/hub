import {
    Button,
    Flex,
    FlexAlign,
    FlexDirection,
    FlexGapSize,
    FlexJustify,
    Typography,
} from '@stackone/malachite';
import React from 'react';

// A server message can run long, or carry an id or URL with no spaces, so it wraps inside the card.
const MESSAGE_STYLE: React.CSSProperties = {
    padding: '0 24px',
    textAlign: 'center',
    overflowWrap: 'anywhere',
};

interface ErrorViewProps {
    message: string;
    title?: string;
    onRetry?: () => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ message, title, onRetry }) => {
    return (
        <Flex
            justify={FlexJustify.Center}
            align={FlexAlign.Center}
            direction={FlexDirection.Vertical}
            gapSize={FlexGapSize.Small}
            fullHeight
        >
            {title ? (
                <>
                    <Typography.Text fontWeight="bold" size="large">
                        {title}
                    </Typography.Text>
                    <div style={MESSAGE_STYLE}>
                        <Typography.SecondaryText>{message}</Typography.SecondaryText>
                    </div>
                </>
            ) : (
                <Typography.Text size="medium" fontWeight="semi-bold">
                    {message}
                </Typography.Text>
            )}
            {onRetry && (
                <Button variant="outline" size="small" onClick={onRetry}>
                    Try again
                </Button>
            )}
        </Flex>
    );
};
