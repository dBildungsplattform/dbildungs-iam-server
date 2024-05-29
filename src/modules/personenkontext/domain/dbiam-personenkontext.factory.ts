import { Injectable } from '@nestjs/common';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { PersonenkontexteUpdate } from './personenkontexte-update.js';
import { DBiamCreatePersonenkontextBodyParams } from '../api/param/dbiam-create-personenkontext.body.params.js';
import { PersonID } from '../../../shared/types/index.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';

@Injectable()
export class DbiamPersonenkontextFactory {
    public constructor(
        private dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private logger: ClassLogger,
    ) {}

    public createNew(
        personId: PersonID,
        lastModified: Date,
        count: number,
        dBiamPersonenkontextBodyParams: DBiamCreatePersonenkontextBodyParams[],
    ): PersonenkontexteUpdate {
        return PersonenkontexteUpdate.createNew(
            this.logger,
            this.dBiamPersonenkontextRepo,
            personId,
            lastModified,
            count,
            dBiamPersonenkontextBodyParams,
        );
    }
}
