import React from 'react';
import Success from '../../../../shared/components/success';

interface SuccessViewProps {
    integrationName: string;
}

export const SuccessView: React.FC<SuccessViewProps> = ({ integrationName }) => {
    return <Success integrationName={integrationName} />;
};
