import React from 'react';
import { Loading } from '../../../../shared/components/loading';

interface LoadingViewProps {
    title: string;
    description: string;
}

export const LoadingView: React.FC<LoadingViewProps> = ({ title, description }) => {
    return <Loading title={title} description={description} />;
};
