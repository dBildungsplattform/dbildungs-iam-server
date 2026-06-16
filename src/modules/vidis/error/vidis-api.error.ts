import { VidisDomainError } from './vidis-domain.error.js';

export class VidisApiError extends VidisDomainError {
    public constructor(public override readonly message: string) {
        super(message ?? `Vidis Api Returned Error`, undefined);
    }
}
