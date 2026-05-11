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
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { FieldErrors, UseFormSetValue } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { ConnectorConfigField } from '../types';
import { formatSecretPlaceholder, isSecretPlaceholder } from '../utils/secretPlaceholder';
import { createFormSchema } from '../utils/zodSchema';

const isInputField = (type: string | undefined): type is 'text' | 'number' | 'password' => {
    return type === 'text' || type === 'number' || type === 'password';
};

interface FieldRendererProps {
    field: ConnectorConfigField;
    errors: FieldErrors;
    setValue: UseFormSetValue<Record<string, unknown>>;
    editingSecrets?: Set<string>;
    setEditingSecrets?: (updater: (prev: Set<string>) => Set<string>) => void;
}

const FieldRenderer: React.FC<FieldRendererProps> = ({
    field,
    errors,
    setValue,
    editingSecrets,
    setEditingSecrets,
}) => {
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

        const isSecret =
            field.key !== 'external-trigger-token' &&
            (field.secret !== false || field.type === 'password');

        const showCopyButton = isReadOnly && fieldValue && !isSecret;
        const isBeingEdited = editingSecrets?.has(key) ?? false;
        const isPlaceholder = isSecret && isSecretPlaceholder(fieldValue) && !isBeingEdited;

        if (isPlaceholder) {
            return (
                <>
                    <Input
                        name={`${key}-display`}
                        label={field.label}
                        placeholder={field.placeholder}
                        type="text"
                        required={field.required}
                        disabled={true}
                        readOnly={true}
                        defaultValue={fieldValue ? formatSecretPlaceholder(fieldValue) : ''}
                        description={field.guide?.description ?? field.description}
                        tooltip={field.guide?.tooltip ?? field.tooltip}
                        showCopyButton={false}
                        buttons={
                            setEditingSecrets
                                ? [
                                      {
                                          label: 'Edit',
                                          variant: 'filled',
                                          size: 'xsmall',
                                          onClick: () => {
                                              setEditingSecrets((prev) => new Set(prev).add(key));
                                              setValue(key, '', {
                                                  shouldValidate: true,
                                                  shouldDirty: true,
                                              });
                                          },
                                      },
                                  ]
                                : undefined
                        }
                    />
                    {errorMessage}
                </>
            );
        }

        const inputDisabled = isSecret ? false : field.readOnly || false;
        const inputOnCopyClick = isSecret
            ? undefined
            : showCopyButton
              ? () => {
                    // Copy functionality is handled in the Input component
                }
              : undefined;

        return (
            <>
                <Input
                    key={`${key}-${isBeingEdited ? 'editing' : 'view'}`}
                    name={key}
                    required={isReadOnly ? true : field.required}
                    placeholder={field.placeholder}
                    disabled={inputDisabled}
                    readOnly={field.readOnly}
                    label={field.label}
                    tooltip={field.guide?.tooltip ?? field.tooltip}
                    description={field.guide?.description ?? field.description}
                    type={field.type}
                    error={!!errors[key]}
                    onChange={(value: string) =>
                        setValue(key, value, {
                            shouldValidate: true,
                        })
                    }
                    defaultValue={isSecret && isBeingEdited ? '' : fieldValue}
                    showPasswordToggle={false}
                    onCopyClick={inputOnCopyClick}
                />
                {errorMessage}
            </>
        );
    }

    if (field.type === 'alert') {
        return (
            <Alert
                type={field.alertType ?? 'info'}
                message={field.description ?? ''}
                hasMargin={false}
            />
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
                    tooltip={field.guide?.tooltip ?? field.tooltip}
                    description={field.guide?.description ?? field.description}
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
            <>
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
                    tooltip={field.guide?.tooltip ?? field.tooltip}
                    description={field.guide?.description ?? field.description}
                    required={field.required}
                    error={!!errors[key]}
                />
                {errorMessage}
            </>
        );
    }

    return null;
};

const ErrorBlock = ({ error }: { error?: { message: string; provider_response: string } }) => {
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
interface IntegrationFieldsProps {
    fields: Array<ConnectorConfigField>;
    error?: {
        message: string;
        provider_response: string;
    };
    onChange: (data: Record<string, string>) => void;
    onValidationChange?: (isValid: boolean) => void;
    integrationName: string;
    editingSecrets?: Set<string>;
    setEditingSecrets?: (updater: (prev: Set<string>) => Set<string>) => void;
}

const NoFieldsView: React.FC<{
    integrationName: string;
    error?: { message: string; provider_response: string };
    alertFields?: ConnectorConfigField[];
}> = ({ integrationName, error, alertFields }) => {
    return (
        <Padded vertical="large" horizontal="medium" overflow="auto" fullHeight>
            {error && (
                <Alert
                    type="error"
                    message={error.provider_response?.trim() || error.message}
                    hasMargin={false}
                >
                    <ErrorBlock error={error} />
                </Alert>
            )}
            {alertFields && alertFields.length > 0 && (
                <Fragment>
                    {alertFields.map((field) => (
                        <Alert
                            key={field.key}
                            type={field.alertType ?? 'info'}
                            message={field.description ?? ''}
                            hasMargin={false}
                        />
                    ))}
                </Fragment>
            )}
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
    editingSecrets,
    setEditingSecrets,
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

    const alertOnlyFields = fields.filter((f) => f.type === 'alert');
    const hasInputFields = fields.some((f) => f.type !== 'alert');

    if (!hasInputFields) {
        return (
            <NoFieldsView
                integrationName={integrationName}
                error={error}
                alertFields={alertOnlyFields}
            />
        );
    }

    return (
        <Padded vertical="large" horizontal="medium" overflow="auto">
            <Spacer direction="vertical" size={8} fullWidth>
                {error && (
                    <Alert type="error" message={error.message} hasMargin={false}>
                        <ErrorBlock error={error} />
                    </Alert>
                )}
                <Form>
                    {fields
                        .filter((field) => field.display !== false)
                        .map((field) => {
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
                                        editingSecrets={editingSecrets}
                                        setEditingSecrets={setEditingSecrets}
                                    />
                                </div>
                            );
                        })}
                </Form>
            </Spacer>
        </Padded>
    );
};
