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

        const hasChanges =
            Object.keys(updatedData).some((key) => updatedData[key] !== formData[key]) ||
            Object.keys(formData).some((key) => !updatedData.hasOwnProperty(key));

        if (hasChanges) {
            setFormData((prev) => ({ ...prev, ...updatedData }));
        }
    }, [fields, formData]);

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
        <div>
            <Spacer direction="vertical" size={8}>
                {guide && <Alert type="info" message={guide?.description} hasMargin={false} />}
                {error && <Alert type="error" message={error.message} hasMargin={false} />}
                {error && <Typography.CodeText>{error.provider_response}</Typography.CodeText>}
                <Form>
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
                                            onChange={(value) =>
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
                                            name={field.key}
                                            required={field.required}
                                            value={formData[field.key] || ''}
                                            onChange={(e) =>
                                                handleFieldChange(field.key, e.target.value)
                                            }
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
                </Form>
            </Spacer>
        </div>
    );
};
