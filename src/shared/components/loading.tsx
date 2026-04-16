import {
    Flex,
    FlexAlign,
    FlexDirection,
    FlexGapSize,
    FlexJustify,
    Spinner,
    Typography,
} from '@stackone/malachite';
import { useEffect, useRef, useState } from 'react';

export const Loading: React.FC<{
    title: string;
    description: string;
    onCancel?: () => void;
}> = ({ title, description, onCancel }) => {
    const [showCancel, setShowCancel] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!onCancel) return;
        timerRef.current = setTimeout(() => setShowCancel(true), 5000);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [onCancel]);

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
            {showCancel && onCancel && (
                <Typography.SecondaryText>
                    Having trouble?{' '}
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            font: 'inherit',
                            color: 'inherit',
                        }}
                    >
                        Cancel and start over
                    </button>
                </Typography.SecondaryText>
            )}
        </Flex>
    );
};
