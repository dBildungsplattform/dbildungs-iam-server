import { SharedDomainError } from './index.js';

export class MultipleRollenartenError extends SharedDomainError {
    public constructor(rollenarten: string[]) {
        super(
            `Multiple unique Rollenarten found in externalPkData: ${rollenarten.join(', ')}`,
            'MULTIPLE_ROLLENARTEN',
            { rollenarten },
        );
    }
}
