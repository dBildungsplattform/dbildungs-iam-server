import { Inject, Injectable, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { EscalatedPermissionAtOrga, EscalatedPersonPermissions } from './escalated-person-permissions.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { PersonID } from '../../../shared/types/index.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { PersonPermissions } from './person-permissions.js';

@Injectable({ scope: Scope.TRANSIENT })
export class EscalatedPersonPermissionsFactory {
    public constructor(
        private readonly organisationRepo: OrganisationRepository,
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        private readonly logger: ClassLogger,

        @Inject(INQUIRER) private readonly parentClass: object,
    ) {}

    public createNew(
        escalatedPermissions: Array<EscalatedPermissionAtOrga>,
        escalatedForPersonId?: PersonID,
    ): EscalatedPersonPermissions {
        const escalator: {
            name: string;
        } = {
            name: escalatedForPersonId ?? this.parentClass?.constructor?.name,
        };

        return EscalatedPersonPermissions.createNew(
            escalator,
            escalatedPermissions,
            this.organisationRepo,
            this.personenkontextRepo,
            this.logger,
        );
    }

    public async fromPersonPermissions(
        personPermissions: PersonPermissions,
        escalatedPermissions: Array<EscalatedPermissionAtOrga>,
    ): Promise<EscalatedPersonPermissions> {
        return await EscalatedPersonPermissions.fromPersonPermissions(
            personPermissions,
            escalatedPermissions,
            this.organisationRepo,
            this.personenkontextRepo,
            this.logger,
        );
    }
}
