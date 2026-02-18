import { IsIn, ValidationOptions } from 'class-validator';
import { RollenSystemRechtEnum } from '../domain/systemrecht.js';

export function IsSystemrechtForRollenAdministration(validationOptions?: ValidationOptions) {
    return IsIn([RollenSystemRechtEnum.ROLLEN_VERWALTEN, RollenSystemRechtEnum.ROLLEN_ERWEITERN], validationOptions);
}
