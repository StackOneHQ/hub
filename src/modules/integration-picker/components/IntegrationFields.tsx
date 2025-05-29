import { Button, Input, Spacer, Typography } from '@stackone/malachite';
import { useMemo, useState } from 'react';
import { connectAccount } from '../queries';
import { ConnectorConfig, Integration } from '../types';

interface IntegrationFieldsProps {
    integration: Integration;
    connectorConfig: ConnectorConfig;
    token: string;
    baseUrl: string;
}
export const IntegrationForm: React.FC<IntegrationFieldsProps> = ({
    integration,
    connectorConfig,
    token,
    baseUrl,
}) => {
    const { fields, guide } = useMemo(() => {
        const authConfig = connectorConfig.authentication?.[integration.authentication_config_key];
        const authConfigForEnvironment = authConfig?.[integration.environment];

        return {
            fields: authConfigForEnvironment?.fields || [],
            guide: authConfigForEnvironment?.guide,
        };
    }, [connectorConfig, integration]);

    const [loading, setLoading] = useState<boolean>();
    const [error, setError] = useState<{
        message: string;
        provider_response: string;
    }>();
    const [success, setSuccess] = useState<boolean>();

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        console.log('submitting form');
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const data: Record<string, string> = {};
        fields.forEach((field) => {
            const value = formData.get(field.key);
            if (value !== null) {
                data[field.key] = value.toString();
            }
        });
        const handleConnect = async () => {
            setError(undefined);
            setLoading(true);
            await connectAccount(baseUrl, token, integration.provider, data)
                .then((response) => {
                    console.log('Connected successfully:', response);
                    setSuccess(true);
                })
                .catch((error) => {
                    console.error('Error connecting:', {
                        error: JSON.parse(error.message),
                    });
                    setError(JSON.parse(error.message));
                })
                .finally(() => {
                    setLoading(false);
                });
        };
        handleConnect();
    };

    return (
        <div>
            <Spacer direction="vertical" size={20}>
                <Typography.PageTitle>Link {integration.name} Account</Typography.PageTitle>
                {guide && guide.supportLink && (
                    <Typography.Link href={guide.supportLink} target="_blank">
                        {guide.description}
                    </Typography.Link>
                )}
                {guide && !guide.supportLink && (
                    <Typography.SecondaryText>{guide.description}</Typography.SecondaryText>
                )}

                {error && (
                    <>
                        <Typography.Text color="red">{error.message}</Typography.Text>
                        <Typography.CodeText>{error.provider_response}</Typography.CodeText>
                    </>
                )}
                {success && (
                    <Typography.Text color="green">
                        Successfully connected to {integration.provider}
                    </Typography.Text>
                )}
                {loading && <Typography.Text>Loading...</Typography.Text>}

                {!loading && !success && (
                    <form onSubmit={onSubmit}>
                        <Spacer direction="vertical" size={20}>
                            {fields.map((field) => {
                                return (
                                    <div key={field.key}>
                                        {(field.type === 'text' ||
                                            field.type === 'number' ||
                                            field.type === 'password' ||
                                            field.type === 'text_area') && (
                                            <Input
                                                name={field.key}
                                                required={field.required}
                                                placeholder={field.placeholder}
                                                defaultValue={field.value?.toString()}
                                                disabled={field.readOnly}
                                                label={field.label}
                                                tooltip={field.guide?.tooltip}
                                                description={field.guide?.description}
                                            />
                                        )}

                                        {field.type === 'select' && (
                                            <select
                                                name={field.key}
                                                required={field.required}
                                                value={field.value}
                                                disabled={field.readOnly}
                                            >
                                                {field.options?.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                );
                            })}
                            {/* <Button type="green" htmlType="submit" fill flexGrow>
                                Connect
                            </Button> */}
                        </Spacer>
                    </form>
                )}
            </Spacer>
        </div>
    );
};
