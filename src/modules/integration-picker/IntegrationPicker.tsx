import { useMemo, useState } from 'react';
import { IntegrationForm } from './components/IntegrationFields';
import { IntegrationSelector } from './components/IntegrationSelector';
import { getConnectorConfig, getHubData } from './queries';
import { Integration } from './types';
import { useQuery } from '@tanstack/react-query';
import {
    Button,
    Card,
    Flex,
    FlexAlign,
    FlexDirection,
    FlexGapSize,
    FlexJustify,
    FooterLinks,
    Padded,
    Spacer,
    Typography,
} from '@stackone/malachite';

interface IntegrationPickerProps {
    token: string;
    baseUrl: string;
}

const Title: React.FC<{
    selectedIntegration: Integration;
    onBack: () => void;
    guide?: { supportLink?: string; description: string };
}> = ({ selectedIntegration, onBack, guide }) => {
    return (
        <Flex
            direction={FlexDirection.Horizontal}
            align={FlexAlign.Center}
            gapSize={FlexGapSize.Small}
            justify={FlexJustify.SpaceBetween}
        >
            <Flex
                direction={FlexDirection.Horizontal}
                align={FlexAlign.Center}
                gapSize={FlexGapSize.Small}
                justify={FlexJustify.Left}
            >
                <Button type="ghost" onClick={onBack} icon="←" size="small"></Button>
                <img
                    src={`https://app.stackone.com/assets/logos/${selectedIntegration?.provider}.png`}
                    alt={selectedIntegration?.provider ?? 'N/A'}
                    style={{ width: '24px', height: '24px' }}
                />
                <Typography.Text fontWeight="semi-bold" size="large">
                    {selectedIntegration?.name ?? 'N/A'}
                </Typography.Text>
            </Flex>
            <Typography.Link href={guide?.supportLink} target="_blank">
                <Button type="outline" size="medium">
                    Connection guide
                </Button>
            </Typography.Link>
        </Flex>
    );
};

const Footer: React.FC<{
    selectedIntegration: Integration | null;
    fullWidth?: boolean;
    onBack: () => void;
}> = ({ fullWidth = true, selectedIntegration, onBack }) => {
    const buttons: Array<{
        label: string;
        type: 'filled' | 'outline';
        onClick: () => void;
        disabled: boolean;
        loading: boolean;
    }> = useMemo(() => {
        return selectedIntegration
            ? [
                  {
                      label: 'Back',
                      type: 'outline',
                      onClick: () => {
                          onBack();
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
            : [];
    }, [selectedIntegration, onBack]);

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

    const { fields, guide } = useMemo(() => {
        if (!connectorData || !selectedIntegration) {
            return {
                fields: [],
            };
        }

        const authConfig =
            connectorData.authentication?.[selectedIntegration.authentication_config_key];
        const authConfigForEnvironment = authConfig?.[selectedIntegration.environment];

        return {
            fields: authConfigForEnvironment?.fields || [],
            guide: authConfigForEnvironment?.guide,
        };
    }, [connectorData, selectedIntegration]);

    if (isLoadingHubData || isLoadingConnectorData) {
        return <div>Loading...</div>;
    }
    if (errorHubData || errorConnectorData) {
        return <div>Error: {errorHubData?.message || errorConnectorData?.message}</div>;
    }

    return (
        <Card
            height="400px"
            footer={
                <Footer
                    selectedIntegration={selectedIntegration}
                    onBack={() => setSelectedIntegration(null)}
                />
            }
            title={
                !selectedIntegration ? null : (
                    <Title
                        selectedIntegration={selectedIntegration}
                        onBack={() => setSelectedIntegration(null)}
                        guide={guide}
                    />
                )
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
                    fields={fields}
                />
            )}
        </Card>
    );
};
