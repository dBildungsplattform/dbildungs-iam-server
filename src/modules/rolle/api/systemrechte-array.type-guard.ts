import { RollenSystemRechtEnum } from '../domain/systemrecht.js';

export function isRollenSystemRechteArray(value: unknown): value is Array<RollenSystemRechtEnum> {
    const isValid: boolean =
        Array.isArray(value) &&
        value.every((recht: unknown) => (Object.values(RollenSystemRechtEnum) as unknown[]).includes(recht));

    return isValid;
}

export function toRollenSystemRechteArray(value: unknown): Array<RollenSystemRechtEnum> {
    if (isRollenSystemRechteArray(value)) {
        return value;
    }

    return [];
}
