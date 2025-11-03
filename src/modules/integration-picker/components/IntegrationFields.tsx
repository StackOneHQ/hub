import {
    Alert,
    CodeBlock,
    Dropdown,
    Form,
    Input,
    Padded,
    Spacer,
    TextArea,
    Typography,
} from '@stackone/malachite';
import { useEffect, useRef, useState } from 'react';
import { ConnectorConfigField } from '../types';
import { validateField } from '../utils/validation';

interface IntegrationFieldsProps {
    fields: Array<ConnectorConfigField>;
    error?: {
        message: string;
        provider_response: string;
    };
    onChange: (data: Record<string, string>) => void;
    onValidationChange?: (errors: Record<string, string>) => void;
}

export const IntegrationForm: React.FC<IntegrationFieldsProps> = ({
    fields,
    onChange,
    error,
    onValidationChange,
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

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

    const handleFieldChange = (key: string, value: string, field?: ConnectorConfigField) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value,
        }));

        if (field?.validation) {
            const validationResult = validateField(value, field.validation);
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                if (!validationResult.isValid && validationResult.errorMessage) {
                    newErrors[key] = validationResult.errorMessage;
                } else {
                    delete newErrors[key];
                }
                onValidationChange?.(newErrors);
                return newErrors;
            });
        } else {
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[key];
                onValidationChange?.(newErrors);
                return newErrors;
            });
        }
    };

    const errorJson = () => {
        if (!error) {
            return null;
        }
        try {
            return <CodeBlock json={JSON.parse(error.provider_response)} />;
        } catch (_e) {
            if (error?.provider_response && error?.provider_response.length > 0) {
                return <CodeBlock code={error?.provider_response} />;
            }
            return null;
        }
    };
    return (
        <Padded vertical="large" horizontal="medium">
            <Spacer direction="vertical" size={8} fullWidth>
                {error && (
                    <Alert type="error" message={error.message} hasMargin={false}>
                        {errorJson()}
                    </Alert>
                )}
                <Spacer direction="vertical" size={20} fullWidth>
                    <Form>
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
                                        <>
                                            <Input
                                                name={key}
                                                required={field.required}
                                                placeholder={field.placeholder}
                                                defaultValue={field.value?.toString()}
                                                onChange={(value: string) =>
                                                    handleFieldChange(key, value, field)
                                                }
                                                disabled={field.readOnly}
                                                label={field.label}
                                                tooltip={field.guide?.tooltip}
                                                description={field.guide?.description}
                                                type={field.type}
                                                error={!!validationErrors[key]}
                                            />
                                            {validationErrors[key] && (
                                                <Typography.Text
                                                    color="error"
                                                    style={{ marginTop: '4px', fontSize: '12px' }}
                                                >
                                                    {validationErrors[key]}
                                                </Typography.Text>
                                            )}
                                        </>
                                    )}

                                    {field.type === 'text_area' && (
                                        <>
                                            <TextArea
                                                name={key}
                                                required={field.required}
                                                defaultValue={formData[key] || ''}
                                                placeholder={field.placeholder}
                                                onChange={(value: string) =>
                                                    handleFieldChange(key, value, field)
                                                }
                                                disabled={field.readOnly}
                                                label={field.label}
                                                tooltip={field.guide?.tooltip}
                                                error={!!validationErrors[key]}
                                            />
                                            {validationErrors[key] && (
                                                <Typography.Text
                                                    color="error"
                                                    style={{ marginTop: '4px', fontSize: '12px' }}
                                                >
                                                    {validationErrors[key]}
                                                </Typography.Text>
                                            )}
                                        </>
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
                    </Form>
                </Spacer>
            </Spacer>
        </Padded>
    );
};
