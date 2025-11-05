import { zodResolver } from '@hookform/resolvers/zod';
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
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { ConnectorConfigField } from '../types';
import { createFormSchema } from '../utils/zodSchema';

interface IntegrationFieldsProps {
    fields: Array<ConnectorConfigField>;
    error?: {
        message: string;
        provider_response: string;
    };
    onChange: (data: Record<string, string>) => void;
    onValidationChange?: (isValid: boolean) => void;
}

export const IntegrationForm: React.FC<IntegrationFieldsProps> = ({
    fields,
    onChange,
    error,
    onValidationChange,
}) => {
    const schema = useMemo(() => createFormSchema(fields), [fields]);

    const defaultValues = useMemo(() => {
        const initialData: Record<string, string> = {};
        fields.forEach((field) => {
            if (field.value !== undefined) {
                initialData[field.key] = field.value.toString();
            } else {
                initialData[field.key] = '';
            }
        });
        return initialData;
    }, [fields]);

    const { formState, watch, reset, setValue } = useForm({
        resolver: zodResolver(schema),
        mode: 'onTouched',
        defaultValues,
    });

    const { errors, isValid } = formState;

    useDeepCompareEffect(() => {
        reset(defaultValues);
    }, [defaultValues]);

    const formData = watch();

    useDeepCompareEffect(() => {
        onChange(formData as Record<string, string>);
    }, [formData]);

    useEffect(() => {
        onValidationChange?.(isValid);
    }, [isValid, onValidationChange]);

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
                                                disabled={field.readOnly}
                                                label={field.label}
                                                tooltip={field.guide?.tooltip}
                                                description={field.guide?.description}
                                                type={field.type}
                                                error={!!errors[key]}
                                                onChange={(value: string) =>
                                                    setValue(key, value, { shouldValidate: true })
                                                }
                                                defaultValue={field.value?.toString()}
                                                showPasswordToggle={false}
                                            />
                                            {errors[key] && (
                                                <Typography.Text
                                                    color="error"
                                                    style={{ marginTop: '4px', fontSize: '12px' }}
                                                >
                                                    {errors[key]?.message as string}
                                                </Typography.Text>
                                            )}
                                        </>
                                    )}

                                    {field.type === 'text_area' && (
                                        <>
                                            <TextArea
                                                name={key}
                                                required={field.required}
                                                placeholder={field.placeholder}
                                                disabled={field.readOnly}
                                                label={field.label}
                                                tooltip={field.guide?.tooltip}
                                                error={!!errors[key]}
                                                onChange={(value: string) =>
                                                    setValue(key, value, { shouldValidate: true })
                                                }
                                                defaultValue={field.value?.toString() || ''}
                                            />
                                            {errors[key] && (
                                                <Typography.Text
                                                    color="error"
                                                    style={{ marginTop: '4px', fontSize: '12px' }}
                                                >
                                                    {errors[key]?.message as string}
                                                </Typography.Text>
                                            )}
                                        </>
                                    )}
                                    {field.type === 'select' && (
                                        <Dropdown
                                            defaultValue={field.value?.toString() || ''}
                                            disabled={field.readOnly}
                                            items={
                                                field.options?.map((option) => ({
                                                    id: option.value,
                                                    label: option.label,
                                                })) ?? []
                                            }
                                            onItemSelected={(value) =>
                                                setValue(key, value ?? '', { shouldValidate: true })
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
