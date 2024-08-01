import { Injectable } from '@nestjs/common';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { PersonenkontexteUpdate } from './personenkontexte-update.js';
import { DbiamPersonenkontextBodyParams } from '../api/param/dbiam-personenkontext.body.params.js';
import { PersonID } from '../../../shared/types/index.js';
import { PersonenkontextFactory } from './personenkontext.factory.js';
import { EventService } from '../../../core/eventbus/index.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { IPersonPermissions } from '../../authentication/domain/person-permissions.interface.js';

@Injectable()
export class DbiamPersonenkontextFactory {
    public constructor(
        private personenkontextFactory: PersonenkontextFactory,
        private readonly eventService: EventService,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly personRepo: PersonRepository,
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepo: OrganisationRepository,
    ) {}

    public createNewPersonenkontexteUpdate(
        personId: PersonID,
        lastModified: Date | undefined,
        count: number,
        dBiamPersonenkontextBodyParams: DbiamPersonenkontextBodyParams[],
        permissions: IPersonPermissions,
    ): PersonenkontexteUpdate {
        return PersonenkontexteUpdate.createNew(
            this.eventService,
            this.dBiamPersonenkontextRepo,
            this.personRepo,
            this.rolleRepo,
            this.organisationRepo,
            this.personenkontextFactory,
            personId,
            lastModified,
            count,
            dBiamPersonenkontextBodyParams,
            permissions,
        );
    }
}
