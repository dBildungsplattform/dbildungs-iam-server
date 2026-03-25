import { Injectable } from '@nestjs/common';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { EscalatedPermissionAtOrga, EscalatedPersonPermissions } from './escalated-person-permissions.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';

@Injectable()
export class EscalatedPersonPermissionsFactory {
    public constructor(
        private readonly organisationRepo: OrganisationRepository,
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
    ) {}

    public static createNew(
        esacalator: { name: string },
        escalatedPermissions: Array<EscalatedPermissionAtOrga>,
    ): EscalatedPersonPermissions {
        return EscalatedPersonPermissions.createNew(
            esacalator,
            escalatedPermissions,
            this.organisationRepo,
            this.personenkontextRepo,
        );
    }
}
