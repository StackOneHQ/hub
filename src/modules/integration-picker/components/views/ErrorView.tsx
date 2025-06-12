import React from 'react';

interface ErrorViewProps {
    message: string;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ message }) => {
    return <div>Error: {message}</div>;
};
