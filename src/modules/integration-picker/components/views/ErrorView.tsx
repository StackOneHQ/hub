import { Typography } from '@stackone/malachite';
import React from 'react';

interface ErrorViewProps {
    message: string;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ message }) => {
    return (
        <div
            style={{
                justifyContent: 'center',
                display: 'flex',
                alignItems: 'center',
                height: '100%',
            }}
        >
            <Typography.Text size="medium" fontWeight="semi-bold">
                {message}
            </Typography.Text>
        </div>
    );
};
