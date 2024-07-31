import { DomainError } from '../error/domain.error.js';
import { NameValidationError } from '../error/name-validation.error.js';

export class NameValidator {
    public static validateName(name: string, fieldName: string): Option<DomainError> {
        const NO_LEADING_TRAILING_WHITESPACE: RegExp = /^(?! ).*(?<! )$/;
        if (!NO_LEADING_TRAILING_WHITESPACE.test(name) || name.trim().length === 0) {
            return new NameValidationError(fieldName);
        }
        return null;
    }
}
