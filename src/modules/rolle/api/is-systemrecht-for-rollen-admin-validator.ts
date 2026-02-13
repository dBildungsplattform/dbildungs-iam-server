import { registerDecorator, ValidationOptions } from 'class-validator';
import { RollenSystemRechtEnum } from '../domain/systemrecht';

export function IsSystemrechtForRollenAdministration(property: string, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isSystemrechtForRollenAdministration',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: any) {
                    return (
                        value === RollenSystemRechtEnum.ROLLEN_VERWALTEN ||
                        value === RollenSystemRechtEnum.ROLLEN_ERWEITERN
                    );
                },
            },
        });
    };
}
