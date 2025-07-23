import { Alert, Form, Input, Spacer, Typography } from '@stackone/malachite';
import { useEffect, useState } from 'react';
import { ConnectorConfigField } from '../types';

interface IntegrationFieldsProps {
    fields: Array<ConnectorConfigField>;
    guide?: { supportLink?: string; description: string };
    error?: {
        message: string;
        provider_response: string;
    };
    onChange: (data: Record<string, string>) => void;
}

export const IntegrationForm: React.FC<IntegrationFieldsProps> = ({
    fields,
    guide,
    onChange,
    error,
}) => {
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
    }, [fields]);

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
        <Spacer direction="vertical" size={8} fullWidth>
            {guide && <Alert type="info" message={guide?.description} hasMargin={false} />}
            {error && <Alert type="error" message={error.message} hasMargin={false} />}
            {error && <Typography.CodeText>{error.provider_response}</Typography.CodeText>}
            <Spacer direction="vertical" size={20} fullWidth>
                {fields.map((field) => {
                    return (
                        <div key={field.key} style={{ width: '100%' }}>
                            {(field.type === 'text' ||
                                field.type === 'number' ||
                                field.type === 'password' ||
                                field.type === 'text_area') && (
                                <Input
                                    key={field.key}
                                    name={field.key}
                                    required={field.required}
                                    placeholder={field.placeholder}
                                    defaultValue={field.value?.toString()}
                                    onChange={(value: string) =>
                                        handleFieldChange(field.key, value)
                                    }
                                    disabled={field.readOnly}
                                    label={field.label}
                                    tooltip={field.guide?.tooltip}
                                    description={field.guide?.description}
                                />
                            )}

                            {field.type === 'select' && (
                                <select
                                    key={field.key}
                                    name={field.key}
                                    required={field.required}
                                    value={formData[field.key] || ''}
                                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
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
            </Spacer>
        </Spacer>
    );
};
