import { Inject, Injectable, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';
import { DBiamPersonenkontextRepo } from '../personenkontext/persistence/dbiam-personenkontext.repo.js';
import {
    EscalatedPermissionAtOrga,
    EscalatedPersonPermissions,
    isEscalatedPersonPermissions,
} from './escalated-person-permissions.js';
import { OrganisationRepository } from '../organisation/persistence/organisation.repository.js';
import { PersonID } from '../../shared/types/index.js';
import { ClassLogger } from '../../core/logging/class-logger.js';
import { PersonPermissions } from '../authentication/domain/person-permissions.js';

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

    public async fromPermissions(
        permissions: PersonPermissions | EscalatedPersonPermissions,
        escalatedPermissions: Array<EscalatedPermissionAtOrga>,
    ): Promise<EscalatedPersonPermissions> {
        if (isEscalatedPersonPermissions(permissions)) {
            permissions.extendEscalation(escalatedPermissions);
            return permissions;
        } else {
            return await EscalatedPersonPermissions.fromPersonPermissions(
                permissions,
                escalatedPermissions,
                this.organisationRepo,
                this.personenkontextRepo,
                this.logger,
            );
        }
    }
}
