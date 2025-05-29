import { useState } from 'react';
import { IntegrationForm } from './components/IntegrationFields';
import { IntegrationSelector } from './components/IntegrationSelector';
import { getConnectorConfig, getHubData } from './queries';
import { Integration } from './types';
import { useQuery } from '@tanstack/react-query';
import {
    Button,
    Card,
    Flex,
    FlexDirection,
    FlexJustify,
    FooterLinks,
    Padded,
    Spacer,
} from '@stackone/malachite';

interface IntegrationPickerProps {
    token: string;
    baseUrl: string;
}

const Footer: React.FC<{
    buttons: {
        label: string;
        type: 'filled' | 'outline';
        onClick: () => void;
        disabled: boolean;
        loading: boolean;
    }[];
    fullWidth?: boolean;
}> = ({ buttons, fullWidth = true }) => {
    return (
        <Spacer direction="horizontal" size={0} justifyContent="space-between">
            <FooterLinks fullWidth={fullWidth} />
            {buttons.length > 0 && (
                <Padded vertical="medium" horizontal="medium" fullHeight={false}>
                    <Flex direction={FlexDirection.Horizontal} justify={FlexJustify.Right}>
                        <Spacer direction="horizontal" size={10}>
                            {buttons.map((button) => (
                                <Button
                                    key={button.label}
                                    size="medium"
                                    type={button.type}
                                    onClick={button.onClick}
                                    disabled={button.disabled}
                                    loading={button.loading}
                                    iconPosition="end"
                                >
                                    {button.label}
                                </Button>
                            ))}
                        </Spacer>
                    </Flex>
                </Padded>
            )}
        </Spacer>
    );
};

export const IntegrationPicker: React.FC<IntegrationPickerProps> = ({ token, baseUrl }) => {
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

    const {
        data: hubData,
        isLoading: isLoadingHubData,
        error: errorHubData,
    } = useQuery({
        queryKey: ['hubData'],
        queryFn: () => getHubData(token, baseUrl),
    });

    const {
        data: connectorData,
        isLoading: isLoadingConnectorData,
        error: errorConnectorData,
    } = useQuery({
        queryKey: ['connectorData', selectedIntegration?.provider],
        queryFn: () => {
            if (!selectedIntegration) {
                return null;
            }

            return getConnectorConfig(baseUrl, token, selectedIntegration.provider);
        },
    });

    if (isLoadingHubData || isLoadingConnectorData) {
        return <div>Loading...</div>;
    }
    if (errorHubData || errorConnectorData) {
        return <div>Error: {errorHubData?.message || errorConnectorData?.message}</div>;
    }

    console.log('selectedIntegration', selectedIntegration);
    return (
        <Card
            height="400px"
            footer={
                <Footer
                    buttons={
                        selectedIntegration
                            ? [
                                  {
                                      label: 'Back',
                                      type: 'outline',
                                      onClick: () => {
                                          setSelectedIntegration(null);
                                      },
                                      disabled: false,
                                      loading: false,
                                  },
                                  {
                                      label: 'Next',
                                      type: 'filled',
                                      onClick: () => {
                                          console.log('Next');
                                      },
                                      disabled: false,
                                      loading: false,
                                  },
                              ]
                            : []
                    }
                />
            }
        >
            {!connectorData && (
                <IntegrationSelector
                    integrations={hubData?.integrations || []}
                    onSelect={setSelectedIntegration}
                />
            )}
            {!connectorData && hubData && hubData.integrations.length === 0 && (
                <div>No integrations found.</div>
            )}
            {connectorData && selectedIntegration && (
                <IntegrationForm
                    integration={selectedIntegration}
                    token={token}
                    baseUrl={baseUrl}
                    connectorConfig={connectorData}
                />
            )}
        </Card>
    );
};
