import { Alert, Input, Spacer, Typography } from '@stackone/malachite';
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
    const handleOnChange = (event: React.ChangeEvent<HTMLFormElement>) => {
        const formData = new FormData(event.currentTarget);
        const data: Record<string, string> = {};
        fields.forEach((field) => {
            const value = formData.get(field.key);
            if (value !== null) {
                data[field.key] = value.toString();
            }
        });
        console.log('handleOnChange', {
            data,
            formData,
        });
        onChange(data);
    };

    return (
        <div>
            <Spacer direction="vertical" size={8}>
                {guide && <Alert type="info" message={guide?.description} hasMargin={false} />}
                {error && <Alert type="error" message={error.message} hasMargin={false} />}
                {error && <Typography.CodeText>{error.provider_response}</Typography.CodeText>}
                <form onChange={handleOnChange}>
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
                    </Spacer>
                </form>
            </Spacer>
        </div>
    );
};
