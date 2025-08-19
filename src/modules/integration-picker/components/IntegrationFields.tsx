import { Alert, CodeBlock, Dropdown, Input, Padded, Spacer, TextArea } from '@stackone/malachite';
import { useEffect, useState } from 'react';
import { ConnectorConfigField } from '../types';

interface IntegrationFieldsProps {
    fields: Array<ConnectorConfigField>;
    error?: {
        message: string;
        provider_response: string;
    };
    onChange: (data: Record<string, string>) => void;
}

export const IntegrationForm: React.FC<IntegrationFieldsProps> = ({ fields, onChange, error }) => {
    // Initialize formData with default values from fields
    const [formData, setFormData] = useState<Record<string, string>>(() => {
        const initialData: Record<string, string> = {};
        fields.forEach((field) => {
            if (field.value !== undefined) {
                initialData[field.key] = field.value.toString();
            }
        });
        return initialData;
    });

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        const updatedData: Record<string, string> = {};
        fields.forEach((field) => {
            if (field.value !== undefined) {
                updatedData[field.key] = field.value.toString();
            }
        });

        setFormData((prev) => {
            const hasChanges =
                Object.keys(updatedData).some((key) => updatedData[key] !== prev[key]) ||
                Object.keys(prev).some((key) => !updatedData.hasOwnProperty(key));

            if (hasChanges) {
                return { ...prev, ...updatedData };
            }
            return prev;
        });
    }, [fields.length]);

    useEffect(() => {
        onChange(formData);
    }, [formData, onChange]);

    const handleFieldChange = (key: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    return (
        <Padded vertical="large" horizontal="medium">
            <Spacer direction="vertical" size={8} fullWidth>
                {error && (
                    <Alert type="error" message={error.message} hasMargin={false}>
                        <CodeBlock json={JSON.parse(error.provider_response)} />
                    </Alert>
                )}
                <Spacer direction="vertical" size={20} fullWidth>
                    {fields.map((field) => {
                        const key =
                            typeof field.key === 'object'
                                ? JSON.stringify(field.key)
                                : String(field.key);
                        return (
                            <div key={key} style={{ width: '100%' }}>
                                {(field.type === 'text' ||
                                    field.type === 'number' ||
                                    field.type === 'password') && (
                                    <Input
                                        name={key}
                                        required={field.required}
                                        placeholder={field.placeholder}
                                        defaultValue={field.value?.toString()}
                                        onChange={(value: string) => handleFieldChange(key, value)}
                                        disabled={field.readOnly}
                                        label={field.label}
                                        tooltip={field.guide?.tooltip}
                                        description={field.guide?.description}
                                        type={field.type}
                                    />
                                )}

                                {field.type === 'text_area' && (
                                    <TextArea
                                        name={key}
                                        required={field.required}
                                        defaultValue={formData[key] || ''}
                                        placeholder={field.placeholder}
                                        onChange={(value: string) => handleFieldChange(key, value)}
                                        disabled={field.readOnly}
                                        label={field.label}
                                        tooltip={field.guide?.tooltip}
                                    />
                                )}
                                {field.type === 'select' && (
                                    <Dropdown
                                        defaultValue={formData[key] || ''}
                                        disabled={field.readOnly}
                                        items={
                                            field.options?.map((option) => ({
                                                id: option.value,
                                                label: option.label,
                                            })) ?? []
                                        }
                                        onItemSelected={(value) =>
                                            handleFieldChange(key, value ?? '')
                                        }
                                        name={key}
                                        label={field.label}
                                        tooltip={field.guide?.tooltip}
                                        description={field.guide?.description}
                                    />
                                )}
                            </div>
                        );
                    })}
                </Spacer>
            </Spacer>
        </Padded>
    );
};
