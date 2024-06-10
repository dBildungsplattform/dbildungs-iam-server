import { Injectable } from '@nestjs/common';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { PersonenkontexteUpdate } from './personenkontexte-update.js';
import { DBiamCreatePersonenkontextBodyParams } from '../api/param/dbiam-create-personenkontext.body.params.js';
import { PersonID } from '../../../shared/types/index.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import {EventService} from "../../../core/eventbus/index.js";

@Injectable()
export class DbiamPersonenkontextFactory {
    public constructor(
        private readonly eventService: EventService,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly logger: ClassLogger,
    ) {}

    public createNew(
        personId: PersonID,
        lastModified: Date,
        count: number,
        dBiamPersonenkontextBodyParams: DBiamCreatePersonenkontextBodyParams[],
    ): PersonenkontexteUpdate {
        return PersonenkontexteUpdate.createNew(
            this.eventService,
            this.logger,
            this.dBiamPersonenkontextRepo,
            personId,
            lastModified,
            count,
            dBiamPersonenkontextBodyParams,
        );
    }
}
