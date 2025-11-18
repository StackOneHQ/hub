import { zodResolver } from '@hookform/resolvers/zod';
import {
    Alert,
    CodeBlock,
    Dropdown,
    Flex,
    FlexAlign,
    FlexDirection,
    FlexGapSize,
    FlexJustify,
    Form,
    Input,
    Padded,
    Spacer,
    TextArea,
    Typography,
} from '@stackone/malachite';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FieldErrors, UseFormSetValue } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { ConnectorConfigField } from '../types';
import { createFormSchema } from '../utils/zodSchema';

const isInputField = (type: string | undefined): type is 'text' | 'number' | 'password' => {
    return type === 'text' || type === 'number' || type === 'password';
};

interface FieldRendererProps {
    field: ConnectorConfigField;
    errors: FieldErrors;
    setValue: UseFormSetValue<Record<string, unknown>>;
    onCopyClick?: (fieldLabel: string) => void;
}

const FieldRenderer: React.FC<FieldRendererProps> = ({ field, errors, setValue, onCopyClick }) => {
    const key = typeof field.key === 'object' ? JSON.stringify(field.key) : String(field.key);

    const errorMessage = errors[key] && (
        <Typography.Text
            color="error"
            style={{
                marginTop: '4px',
                fontSize: '12px',
            }}
        >
            {errors[key]?.message as string}
        </Typography.Text>
    );

    if (isInputField(field.type)) {
        const isReadOnly = field.readOnly;
        const fieldValue = field.value?.toString();
        const showCopyButton = isReadOnly && fieldValue;

        return (
            <>
                <Input
                    name={key}
                    required={isReadOnly ? true : field.required}
                    placeholder={field.placeholder}
                    disabled={field.readOnly}
                    readOnly={field.readOnly}
                    label={field.label}
                    tooltip={field.guide?.tooltip}
                    description={field.guide?.description}
                    type={field.type}
                    error={!!errors[key]}
                    onChange={(value: string) =>
                        setValue(key, value, {
                            shouldValidate: true,
                        })
                    }
                    defaultValue={fieldValue}
                    showPasswordToggle={false}
                    onCopyClick={
                        showCopyButton && onCopyClick ? () => onCopyClick(field.label) : undefined
                    }
                />
                {errorMessage}
            </>
        );
    }

    if (field.type === 'text_area') {
        return (
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
                        setValue(key, value, {
                            shouldValidate: true,
                        })
                    }
                    defaultValue={field.value?.toString() || ''}
                />
                {errorMessage}
            </>
        );
    }

    if (field.type === 'select') {
        return (
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
                    setValue(key, value ?? '', {
                        shouldValidate: true,
                    })
                }
                name={key}
                label={field.label}
                tooltip={field.guide?.tooltip}
                description={field.guide?.description}
            />
        );
    }

    return null;
};

interface IntegrationFieldsProps {
    fields: Array<ConnectorConfigField>;
    error?: {
        message: string;
        provider_response: string;
    };
    onChange: (data: Record<string, string>) => void;
    onValidationChange?: (isValid: boolean) => void;
    integrationName: string;
}

const NoFieldsView: React.FC<{ integrationName: string }> = ({ integrationName }) => {
    return (
        <Padded vertical="large" horizontal="medium" overflow="auto" fullHeight>
            <Flex
                direction={FlexDirection.Vertical}
                gapSize={FlexGapSize.Small}
                fullHeight
                justify={FlexJustify.Center}
                align={FlexAlign.Center}
            >
                <Spacer direction="vertical" size={8} fullWidth>
                    <Typography.Text size="small" fontWeight={'semi-bold'}>
                        Press "Connect" below to authenticate
                    </Typography.Text>
                    <Typography.Text size="small" color="secondary">
                        An authentication window for {integrationName} will display,
                        <br />
                        please complete the necessary steps.
                    </Typography.Text>
                </Spacer>
            </Flex>
        </Padded>
    );
};

export const IntegrationForm: React.FC<IntegrationFieldsProps> = ({
    fields,
    onChange,
    error,
    onValidationChange,
    integrationName,
}) => {
    const [copySuccess, setCopySuccess] = useState<string | null>(null);
    const copySuccessTimeoutRef = useRef<number | null>(null);
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

    const handleCopyClick = (fieldLabel: string) => {
        if (copySuccessTimeoutRef.current !== null) {
            clearTimeout(copySuccessTimeoutRef.current);
        }

        setCopySuccess(`${fieldLabel} copied to clipboard`);

        copySuccessTimeoutRef.current = window.setTimeout(() => {
            setCopySuccess(null);
            copySuccessTimeoutRef.current = null;
        }, 3000);
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

    if (fields.length === 0) {
        return <NoFieldsView integrationName={integrationName} />;
    }

    return (
        <Padded vertical="large" horizontal="medium" overflow="auto">
            <Spacer direction="vertical" size={8} fullWidth>
                {error && (
                    <Alert type="error" message={error.message} hasMargin={false}>
                        {errorJson()}
                    </Alert>
                )}
                {copySuccess && <Alert type="success" message={copySuccess} hasMargin={false} />}
                <Form>
                    {fields.map((field) => {
                        const key =
                            typeof field.key === 'object'
                                ? JSON.stringify(field.key)
                                : String(field.key);
                        return (
                            <div key={key} style={{ width: '100%' }}>
                                <FieldRenderer
                                    field={field}
                                    errors={errors}
                                    setValue={setValue}
                                    onCopyClick={handleCopyClick}
                                />
                            </div>
                        );
                    })}
                </Form>
            </Spacer>
        </Padded>
    );
};
