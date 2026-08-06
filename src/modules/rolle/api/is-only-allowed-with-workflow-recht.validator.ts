import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { RollenSystemRechtEnum } from '../domain/systemrecht.js';
import { OPERATION_RECHTE } from './operation-rechte.js';

@ValidatorConstraint({ name: 'isOnlyAllowedWithOperationRecht', async: false })
export class IsOnlyAllowedWithOperationRechtConstraint implements ValidatorConstraintInterface {
    public validate(value: unknown, args: ValidationArguments): boolean {
        const systemrechte: unknown = 'systemrechte' in args.object ? args.object.systemrechte : undefined;
        const isOperationRight: boolean =
            Array.isArray(systemrechte) &&
            systemrechte.some((r: unknown) => OPERATION_RECHTE.includes(r as RollenSystemRechtEnum));

        const isValid: boolean = isOperationRight || value === undefined;

        return isValid;
    }

    public defaultMessage(): string {
        return 'organisationIdContextForOperation can only be used with ROLLEN_ERWEITERN or IMPORT_DURCHFUEHREN. Use organisationIdsForFilter instead.';
    }
}

export function IsOnlyAllowedWithOperationRecht(validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: object, propertyName: string | symbol): void {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName as string,
            options: validationOptions,
            constraints: [],
            validator: IsOnlyAllowedWithOperationRechtConstraint,
        });
    };
}
