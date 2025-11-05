import { z } from 'zod';
import { ConnectorConfigField } from '../types';

function createFieldSchema(field: ConnectorConfigField): z.ZodTypeAny {
    let schema: z.ZodString = z.string();

    if (field.required) {
        schema = schema.min(1, `${field.label} is required`);
    }

    if (field.type === 'number') {
        if (field.required) {
            schema = schema.regex(/^\d+$/, 'Must be a valid number');
        } else {
            return z.string().refine(
                (val) => val === '' || /^\d+$/.test(val),
                'Must be a valid number'
            );
        }
    }

    if (field.validation) {
        if (field.validation.type === 'html-pattern') {
            const pattern = new RegExp(field.validation.pattern);
            const errorMessage =
                field.validation.error ||
                `Please match the required format: ${field.validation.pattern}`;

            if (field.required) {
                schema = schema.regex(pattern, errorMessage);
            } else {
                return z.string().refine(
                    (val) => val === '' || pattern.test(val),
                    errorMessage
                );
            }
        } else if (field.validation.type === 'domain') {
            const pattern = new RegExp(`.*${field.validation.pattern}\\.com.*`);
            const errorMessage =
                field.validation.error ||
                `Please enter a valid ${field.validation.pattern}.com domain`;

            if (field.required) {
                schema = schema.regex(pattern, errorMessage);
            } else {
                return z.string().refine(
                    (val) => val === '' || pattern.test(val),
                    errorMessage
                );
            }
        }
    }

    if (!field.required) {
        return z.union([z.string().length(0), schema]);
    }

    return schema;
}

export function createFormSchema(fields: ConnectorConfigField[]) {
    const schemaShape: Record<string, z.ZodTypeAny> = {};

    for (const field of fields) {
        schemaShape[field.key] = createFieldSchema(field);
    }

    return z.object(schemaShape);
}
