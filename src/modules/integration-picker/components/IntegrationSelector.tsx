import { Button } from '@stackone/malachite';
import { Integration } from '../types';

interface IntegrationRowProps {
    integration: Integration;
    onClick?: (integration: Integration) => void;
}

const IntegrationRow: React.FC<IntegrationRowProps> = ({ integration, onClick }) => {
    return (
        <Button
            type="secondary"
            size="large"
            fill
            outline
            flexGrow
            onClick={() => onClick && integration.version === '2' && onClick(integration)}
        >
            <img
                src={`https://app.stackone.com/assets/logos/${integration.provider}.png`}
                alt={integration.provider}
                style={{ width: '40px', height: '40px' }}
            />
            {integration.name ?? 'N/A'} {integration.type.toUpperCase()}
        </Button>
    );
};

export const IntegrationSelector: React.FC<{
    integrations: Integration[];
    onSelect: (integration: Integration) => void;
}> = ({ integrations, onSelect }) => {
    return (
        <>
            <div style={{ marginTop: '20px', marginBottom: '50px' }}>
                <h1>Select Integration</h1>
                <p>Choose which integration you'd like to set up.</p>
            </div>
            {integrations
                ?.filter((integration) => integration.active)
                .map((integration) => (
                    <>
                        <IntegrationRow
                            key={integration.provider}
                            integration={integration}
                            onClick={(selectedIntegration) => onSelect(selectedIntegration)}
                        />
                        <br />
                    </>
                ))}
        </>
    );
};
