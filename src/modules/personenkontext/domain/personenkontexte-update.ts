import { DBiamCreatePersonenkontextBodyParams } from '../api/param/dbiam-create-personenkontext.body.params.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { Personenkontext } from './personenkontext.js';
import { PersonenkontexteUpdateCountError } from '../specification/error/personenkontexte-update-count.error.js';
import { PersonenkontexteUpdateNotFoundError } from '../specification/error/personenkontexte-update-not-found.error.js';
import { PersonenkontextSpecificationError } from '../specification/error/personenkontext-specification.error';

export class PersonenkontexteUpdate {
    private constructor(
        private dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly lastModified: Date,
        private readonly count: number,
        private readonly dBiamPersonenkontextBodyParams: DBiamCreatePersonenkontextBodyParams[],
    ) {}

    public static createNew(
        dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        lastModified: Date,
        count: number,
        dBiamPersonenkontextBodyParams: DBiamCreatePersonenkontextBodyParams[],
    ): PersonenkontexteUpdate {
        return new PersonenkontexteUpdate(
            dBiamPersonenkontextRepo,
            lastModified,
            count,
            dBiamPersonenkontextBodyParams,
        );
    }

    public async validate(): Promise<boolean | PersonenkontextSpecificationError> {
        const personenKontexte: Personenkontext<true>[] = [];
        for (const pkBodyParam of this.dBiamPersonenkontextBodyParams) {
            const pk: Option<Personenkontext<true>> = await this.dBiamPersonenkontextRepo.find(
                pkBodyParam.personId,
                pkBodyParam.organisationId,
                pkBodyParam.rolleId,
            );
            if (!pk) {
                return new PersonenkontexteUpdateNotFoundError(
                    pkBodyParam.personId,
                    pkBodyParam.organisationId,
                    pkBodyParam.rolleId,
                );
            }
            personenKontexte.push(pk);
        }

        if (personenKontexte.length != this.count) {
            return new PersonenkontexteUpdateCountError();
        }

        console.log(this.lastModified);
        return true;
    }
}
