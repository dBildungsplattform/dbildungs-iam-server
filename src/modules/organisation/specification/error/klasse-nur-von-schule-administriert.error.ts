import { OrganisationSpecificationError } from './organisation-specification.error.js';
import { OrganisationSpecificationErrorI18nTypes } from '../../api/dbiam-organisation.error.js';

export class KlasseNurVonSchuleAdministriertError extends OrganisationSpecificationError {
    public constructor(entityId?: string, details?: unknown[] | Record<string, undefined>) {
        super(
            `Organisation with ID ${entityId} could not be updated because it violates ${OrganisationSpecificationErrorI18nTypes.KLASSE_NUR_VON_SCHULE_ADMINISTRIERT} specification`,
            entityId,
            details,
        );
    }
}
