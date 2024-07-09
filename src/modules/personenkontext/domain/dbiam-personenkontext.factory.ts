import { Injectable } from '@nestjs/common';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { PersonenkontexteUpdate } from './personenkontexte-update.js';
import { DbiamPersonenkontextBodyParams } from '../api/param/dbiam-personenkontext.body.params.js';
import { PersonID } from '../../../shared/types/index.js';
import { PersonenkontextFactory } from './personenkontext.factory.js';
import { EventService } from '../../../core/eventbus/index.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';

@Injectable()
export class DbiamPersonenkontextFactory {
    public constructor(
        private personenkontextFactory: PersonenkontextFactory,
        private readonly eventService: EventService,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly personRepo: PersonRepo,
    ) {}

    public createNewPersonenkontexteUpdate(
        personId: PersonID,
        lastModified: Date,
        count: number,
        dBiamPersonenkontextBodyParams: DbiamPersonenkontextBodyParams[],
    ): PersonenkontexteUpdate {
        return PersonenkontexteUpdate.createNew(
            this.eventService,
            this.personRepo,
            this.dBiamPersonenkontextRepo,
            this.personenkontextFactory,
            personId,
            lastModified,
            count,
            dBiamPersonenkontextBodyParams,
        );
    }
}
