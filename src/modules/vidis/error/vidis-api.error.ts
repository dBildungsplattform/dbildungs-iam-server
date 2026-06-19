import { VidisDomainError } from './vidis-domain.error.js';

export class VidisApiError extends VidisDomainError {
    public constructor(public override readonly message: string = 'Vidis Api Returned Error') {
        super(message, undefined);
    }
}
