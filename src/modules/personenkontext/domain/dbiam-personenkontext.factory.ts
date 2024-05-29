import { Injectable } from '@nestjs/common';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { PersonenkontexteUpdate } from './personenkontexte-update.js';
import { DBiamCreatePersonenkontextBodyParams } from '../api/param/dbiam-create-personenkontext.body.params.js';

@Injectable()
export class DbiamPersonenkontextFactory {
    public constructor(private dBiamPersonenkontextRepo: DBiamPersonenkontextRepo) {}

    public createNew(
        lastModified: Date,
        count: number,
        dBiamPersonenkontextBodyParams: DBiamCreatePersonenkontextBodyParams[],
    ): PersonenkontexteUpdate {
        return PersonenkontexteUpdate.createNew(
            this.dBiamPersonenkontextRepo,
            lastModified,
            count,
            dBiamPersonenkontextBodyParams,
        );
    }
}
