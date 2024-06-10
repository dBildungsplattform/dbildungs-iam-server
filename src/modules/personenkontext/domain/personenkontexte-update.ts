import { DBiamCreatePersonenkontextBodyParams } from '../api/param/dbiam-create-personenkontext.body.params.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { Personenkontext } from './personenkontext.js';
import { UpdateCountError } from './error/update-count.error.js';
import { UpdateNotFoundError } from './error/update-not-found.error.js';
import { EntityNotFoundError } from '../../../shared/error/index.js';
import { UpdateOutdatedError } from './error/update-outdated.error.js';
import { PersonID } from '../../../shared/types/index.js';
import { UpdatePersonIdMismatchError } from './error/update-person-id-mismatch.error.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { PersonenkontexteUpdateError } from './error/personenkontexte-update.error.js';
import { EventService } from '../../../core/eventbus/index.js';
import { PersonenkontextDeletedEvent } from '../../../shared/events/personenkontext-deleted.event.js';

export class PersonenkontexteUpdate {
    private constructor(
        private readonly eventService: EventService,
        private readonly logger: ClassLogger,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly personId: PersonID,
        private readonly lastModified: Date,
        private readonly count: number,
        private readonly dBiamPersonenkontextBodyParams: DBiamCreatePersonenkontextBodyParams[],
    ) {}

    public static createNew(
        eventService: EventService,
        logger: ClassLogger,
        dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        personId: PersonID,
        lastModified: Date,
        count: number,
        dBiamPersonenkontextBodyParams: DBiamCreatePersonenkontextBodyParams[],
    ): PersonenkontexteUpdate {
        return new PersonenkontexteUpdate(
            eventService,
            logger,
            dBiamPersonenkontextRepo,
            personId,
            lastModified,
            count,
            dBiamPersonenkontextBodyParams,
        );
    }

    private async getSentPersonenkontexte(): Promise<Personenkontext<true>[] | PersonenkontexteUpdateError> {
        const personenKontexte: Personenkontext<true>[] = [];
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
                return new UpdateNotFoundError(pkBodyParam.personId, pkBodyParam.organisationId, pkBodyParam.rolleId);
            }
            personenKontexte.push(pk);
        }

        return personenKontexte;
    }

    private validate(existingPKs: Personenkontext<true>[]): Option<PersonenkontexteUpdateError> {
        if (existingPKs.length == 0) {
            return new EntityNotFoundError();
        }
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

    public async update(): Promise<Option<PersonenkontexteUpdateError>> {
        const sentPKs: Personenkontext<true>[] | PersonenkontexteUpdateError = await this.getSentPersonenkontexte();
        if (sentPKs instanceof PersonenkontexteUpdateError) {
            return sentPKs;
        }

        const existingPKs: Personenkontext<true>[] = await this.dBiamPersonenkontextRepo.findByPerson(this.personId);
        const validationError: Option<PersonenkontexteUpdateError> = this.validate(existingPKs);
        if (validationError) {
            return validationError;
        }

        for (const existingPK of existingPKs) {
            if (
                !sentPKs.some(
                    (pk: Personenkontext<true>) =>
                        pk.personId == existingPK.personId &&
                        pk.organisationId == existingPK.organisationId &&
                        pk.rolleId == existingPK.rolleId,
                )
            ) {
                this.logger.info(`DELETE ${existingPK.organisationId}`);
                await this.dBiamPersonenkontextRepo.delete(existingPK);
                this.eventService.publish(
                    new PersonenkontextDeletedEvent(existingPK.personId, existingPK.organisationId, existingPK.rolleId),
                );
            }
        }

        return null;
    }
}
