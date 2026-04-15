import React from 'react';
import { Loading } from '../../../../shared/components/loading';

interface LoadingViewProps {
    title: string;
    description: string;
    onCancel?: () => void;
}

export const LoadingView: React.FC<LoadingViewProps> = ({ title, description, onCancel }) => {
    return <Loading title={title} description={description} onCancel={onCancel} />;
};
