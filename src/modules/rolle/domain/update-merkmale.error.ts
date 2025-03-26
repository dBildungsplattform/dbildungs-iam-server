import { RolleDomainError } from './rolle-domain.error.js';

export class UpdateMerkmaleError extends RolleDomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            'The Merkmale for the Rolle cannot be updated because the Rolle is already assigned to a Personkontext',
            undefined,
            details,
        );
    }
}
