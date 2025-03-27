import { OrganisationSpecificationError } from './organisation-specification.error.js';

export class TraegerUnterRootChildError extends OrganisationSpecificationError {
    public constructor(entityId?: string, details?: unknown[] | Record<string, undefined>) {
        super('The Schulträger must be a direct child of either Öffentliche or Ersatz.', entityId, details);
    }
}
