import { RolleDomainError } from './rolle-domain.error.js';

export class RolleHatPersonenkontexteError extends RolleDomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super('Rolle is already assigned to a Personkontext', undefined, details);
    }
}
