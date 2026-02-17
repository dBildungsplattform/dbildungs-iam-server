import { registerDecorator, ValidationOptions } from 'class-validator';
import { RollenSystemRechtEnum } from '../domain/systemrecht.js';

export function IsSystemrechtForRollenAdministration(property: string, validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string): void {
        registerDecorator({
            name: 'isSystemrechtForRollenAdministration',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: unknown): boolean {
                    return (
                        value === RollenSystemRechtEnum.ROLLEN_VERWALTEN ||
                        value === RollenSystemRechtEnum.ROLLEN_ERWEITERN
                    );
                },
            },
        });
    };
}
