import { DBiamCreatePersonenkontextBodyParams } from '../api/param/dbiam-create-personenkontext.body.params.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { Personenkontext } from './personenkontext.js';
import { UpdateCountError } from './error/update-count.error.js';
import { UpdateOutdatedError } from './error/update-outdated.error.js';
import { PersonID } from '../../../shared/types/index.js';
import { UpdatePersonIdMismatchError } from './error/update-person-id-mismatch.error.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { PersonenkontexteUpdateError } from './error/personenkontexte-update.error.js';
import { PersonenkontextFactory } from './personenkontext.factory.js';

export class PersonenkontexteUpdate {
    private constructor(
        private readonly logger: ClassLogger,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly personenkontextFactory: PersonenkontextFactory,
        private readonly personId: PersonID,
        private readonly lastModified: Date,
        private readonly count: number,
        private readonly dBiamPersonenkontextBodyParams: DBiamCreatePersonenkontextBodyParams[],
    ) {}

    public static createNew(
        logger: ClassLogger,
        dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        personenkontextFactory: PersonenkontextFactory,
        personId: PersonID,
        lastModified: Date,
        count: number,
        dBiamPersonenkontextBodyParams: DBiamCreatePersonenkontextBodyParams[],
    ): PersonenkontexteUpdate {
        return new PersonenkontexteUpdate(
            logger,
            dBiamPersonenkontextRepo,
            personenkontextFactory,
            personId,
            lastModified,
            count,
            dBiamPersonenkontextBodyParams,
        );
    }

    private async getSentPersonenkontexte(): Promise<Personenkontext<boolean>[] | PersonenkontexteUpdateError> {
        const personenKontexte: Personenkontext<boolean>[] = [];
        for (const pkBodyParam of this.dBiamPersonenkontextBodyParams) {
            if (pkBodyParam.personId != this.personId) {
                return new UpdatePersonIdMismatchError();
            }
            const pk: Option<Personenkontext<true>> = await this.dBiamPersonenkontextRepo.find(
                pkBodyParam.personId,
                pkBodyParam.organisationId,
                pkBodyParam.rolleId,
            );
            if (!pk) {
                const newPK: Personenkontext<false> = this.personenkontextFactory.createNew(
                    pkBodyParam.personId,
                    pkBodyParam.organisationId,
                    pkBodyParam.rolleId,
                );
                personenKontexte.push(newPK);
            } else {
                personenKontexte.push(pk);
            }
        }

        return personenKontexte;
    }

    private validate(existingPKs: Personenkontext<true>[]): Option<PersonenkontexteUpdateError> {
        if (existingPKs.length != this.count) {
            return new UpdateCountError();
        }

        const sortedExistingPKs: Personenkontext<true>[] = existingPKs.sort(
            (pk1: Personenkontext<true>, pk2: Personenkontext<true>) => (pk1.updatedAt < pk2.updatedAt ? 1 : -1),
        );
        const mostRecentUpdatedAt: Date = sortedExistingPKs[0]!.updatedAt;

        if (mostRecentUpdatedAt.getTime() > this.lastModified.getTime()) {
            return new UpdateOutdatedError();
        }

        return null;
    }

    private async delete(existingPKs: Personenkontext<true>[], sentPKs: Personenkontext<boolean>[]): Promise<void> {
        for (const existingPK of existingPKs) {
            if (
                !sentPKs.some(
                    (pk: Personenkontext<true>) =>
                        pk.personId == existingPK.personId &&
                        pk.organisationId == existingPK.organisationId &&
                        pk.rolleId == existingPK.rolleId,
                )
            ) {
                this.logger.info(
                    `DELETE PK with ${existingPK.personId}, ${existingPK.organisationId}, ${existingPK.rolleId}`,
                );
                await this.dBiamPersonenkontextRepo.delete(existingPK);
            }
        }
    }

    private async add(existingPKs: Personenkontext<true>[], sentPKs: Personenkontext<boolean>[]): Promise<void> {
        for (const sentPK of sentPKs) {
            if (
                !existingPKs.some(
                    (existingPK: Personenkontext<true>) =>
                        existingPK.personId == sentPK.personId &&
                        existingPK.organisationId == sentPK.organisationId &&
                        existingPK.rolleId == sentPK.rolleId,
                )
            ) {
                this.logger.info(`ADD PK with ${sentPK.personId}, ${sentPK.organisationId}, ${sentPK.rolleId}`);
                await this.dBiamPersonenkontextRepo.save(sentPK);
            }
        }
    }

    public async update(): Promise<Option<PersonenkontexteUpdateError>> {
        const sentPKs: Personenkontext<boolean>[] | PersonenkontexteUpdateError = await this.getSentPersonenkontexte();
        if (sentPKs instanceof PersonenkontexteUpdateError) {
            return sentPKs;
        }

        const existingPKs: Personenkontext<true>[] = await this.dBiamPersonenkontextRepo.findByPerson(this.personId);
        const validationError: Option<PersonenkontexteUpdateError> = this.validate(existingPKs);
        if (validationError) {
            return validationError;
        }

        await this.delete(existingPKs, sentPKs);
        await this.add(existingPKs, sentPKs);

        return null;
    }
}
