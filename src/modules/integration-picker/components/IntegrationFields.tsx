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
    MultiSelect,
    type MultiSelectOption,
    Padded,
    Spacer,
    TextArea,
    Typography,
} from '@stackone/malachite';
import { useEffect, useMemo } from 'react';
import { FieldErrors, UseFormSetValue } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { AuthenticationNotice, ConnectorConfigField } from '../types';
import { partitionNotices } from '../utils/partitionNotices';
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

    if (field.type === 'multi-select') {
        return (
            <MultiSelectField field={field} fieldKey={key} errors={errors} setValue={setValue} />
        );
    }

    return null;
};

/** Multi-select field using Malachite MultiSelect with defaultValue (uncontrolled mode) */
const MultiSelectField: React.FC<{
    field: ConnectorConfigField;
    fieldKey: string;
    errors: FieldErrors;
    setValue: UseFormSetValue<Record<string, unknown>>;
}> = ({ field, fieldKey, errors, setValue }) => {
    const delimiter = field.delimiter?.trim() || ' ';
    const initialValue = field.value?.toString() || '';
    const defaultValues = initialValue
        ? initialValue
              .split(delimiter)
              .map((v) => v.trim())
              .filter(Boolean)
        : [];

    const multiSelectOptions: MultiSelectOption[] = (field.options ?? []).map((opt) => ({
        value: opt.value,
        label: opt.label,
        ...(opt.description
            ? { description: opt.description, descriptionMode: 'icon' as const }
            : {}),
    }));

    const errorMessage = errors[fieldKey] && (
        <Typography.Text color="error" style={{ fontSize: '12px' }}>
            {errors[fieldKey]?.message as string}
        </Typography.Text>
    );

    return (
        <>
            <MultiSelect
                options={multiSelectOptions}
                defaultValue={defaultValues}
                onChange={(selected: string[]) => {
                    setValue(fieldKey, selected.join(delimiter), {
                        shouldValidate: true,
                    });
                }}
                placeholder={field.placeholder || 'Select...'}
                size="medium"
                error={!!errors[fieldKey]}
                name={fieldKey}
                label={field.label}
                description={field.guide?.description ?? field.description}
                tooltip={field.guide?.tooltip ?? field.tooltip}
                required={field.required}
                disabled={field.readOnly}
                chips
                chipsMax={4}
                inlineSearch
            />
            {errorMessage}
        </>
    );
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
    notices?: Array<AuthenticationNotice>;
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
    notices?: AuthenticationNotice[];
}> = ({ integrationName, error, notices = [] }) => {
    const topNotices = notices.filter((n) => !n.position || n.position === 'top');
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
            {topNotices.map((n) => (
                <Alert key={n.key} type={n.type} message={n.description} hasMargin={false} />
            ))}
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
    notices = [],
    onChange,
    error,
    onValidationChange,
    integrationName,
    editingSecrets,
    setEditingSecrets,
}) => {
    const displayedFields = fields.filter((f) => f.display !== false);
    const fieldKeys = displayedFields.map((f) =>
        typeof f.key === 'object' ? JSON.stringify(f.key) : String(f.key),
    );
    const { noticesBefore, noticesAfter } = partitionNotices(notices, fieldKeys);
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

    if (displayedFields.length === 0) {
        return <NoFieldsView integrationName={integrationName} error={error} notices={notices} />;
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
                    {displayedFields.map((field) => {
                        const key =
                            typeof field.key === 'object'
                                ? JSON.stringify(field.key)
                                : String(field.key);
                        const hasNotices =
                            noticesBefore(key).length > 0 || noticesAfter(key).length > 0;
                        return (
                            <div
                                key={key}
                                style={{
                                    ...(hasNotices && {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                    }),
                                    width: '100%',
                                }}
                            >
                                {noticesBefore(key).map((n) => (
                                    <Alert
                                        key={n.key}
                                        type={n.type}
                                        message={n.description}
                                        hasMargin={false}
                                    />
                                ))}
                                <FieldRenderer
                                    field={field}
                                    errors={errors}
                                    setValue={setValue}
                                    editingSecrets={editingSecrets}
                                    setEditingSecrets={setEditingSecrets}
                                />
                                {noticesAfter(key).map((n) => (
                                    <Alert
                                        key={n.key}
                                        type={n.type}
                                        message={n.description}
                                        hasMargin={false}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </Form>
            </Spacer>
        </Padded>
    );
};
