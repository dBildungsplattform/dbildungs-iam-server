import { DbiamPersonenkontextBodyParams } from '../api/param/dbiam-personenkontext.body.params.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { Personenkontext } from './personenkontext.js';
import { UpdateCountError } from './error/update-count.error.js';
import { UpdateOutdatedError } from './error/update-outdated.error.js';
import { PersonID } from '../../../shared/types/index.js';
import { UpdatePersonIdMismatchError } from './error/update-person-id-mismatch.error.js';
import { PersonenkontexteUpdateError } from './error/personenkontexte-update.error.js';
import { PersonenkontextFactory } from './personenkontext.factory.js';
import { EventService } from '../../../core/eventbus/index.js';
import { PersonenkontextDeletedEvent } from '../../../shared/events/personenkontext-deleted.event.js';
import { PersonenkontextCreatedEvent } from '../../../shared/events/personenkontext-created.event.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';
import { PersonDo } from '../../person/domain/person.do.js';
import { UpdatePersonNotFoundError } from './error/update-person-not-found.error.js';

export class PersonenkontexteUpdate {
    private constructor(
        private readonly eventService: EventService,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly personRepo: PersonRepo,
        private readonly personenkontextFactory: PersonenkontextFactory,
        private readonly personId: PersonID,
        private readonly lastModified: Date | undefined,
        private readonly count: number,
        private readonly dBiamPersonenkontextBodyParams: DbiamPersonenkontextBodyParams[],
    ) {}

    public static createNew(
        eventService: EventService,
        personRepo: PersonRepo,
        dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        personenkontextFactory: PersonenkontextFactory,
        personId: PersonID,
        lastModified: Date | undefined,
        count: number,
        dBiamPersonenkontextBodyParams: DbiamPersonenkontextBodyParams[],
    ): PersonenkontexteUpdate {
        return new PersonenkontexteUpdate(
            eventService,
            dBiamPersonenkontextRepo,
            personRepo,
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

    private async validate(existingPKs: Personenkontext<true>[]): Promise<Option<PersonenkontexteUpdateError>> {
        const person: Option<PersonDo<true>> = await this.personRepo.findById(this.personId);

        if (!person) {
            return new UpdatePersonNotFoundError();
        }

        if (existingPKs.length !== this.count) {
            return new UpdateCountError();
        }

        if (existingPKs.length === 0) {
            // If there are no existing PKs and lastModified is undefined, it's okay and validation stops here with no error
            return null;
        }

        const sortedExistingPKs: Personenkontext<true>[] = existingPKs.sort(
            (pk1: Personenkontext<true>, pk2: Personenkontext<true>) => (pk1.updatedAt < pk2.updatedAt ? 1 : -1),
        );
        const mostRecentUpdatedAt: Date = sortedExistingPKs[0]!.updatedAt;

        if (this.lastModified === undefined) {
            // If there are existing PKs but lastModified is undefined, return an error
            return new UpdateOutdatedError();
        }

        if (mostRecentUpdatedAt.getTime() > this.lastModified.getTime()) {
            // The existing data is newer than the incoming update
            return new UpdateOutdatedError();
        }

        // If mostRecentUpdatedAt is less than or equal to this.lastModified, no error is returned
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
                await this.dBiamPersonenkontextRepo.delete(existingPK);
                this.eventService.publish(
                    new PersonenkontextDeletedEvent(existingPK.personId, existingPK.organisationId, existingPK.rolleId),
                );
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
                await this.dBiamPersonenkontextRepo.save(sentPK);
                this.eventService.publish(
                    new PersonenkontextCreatedEvent(sentPK.personId, sentPK.organisationId, sentPK.rolleId),
                );
            }
        }
    }

    public async update(): Promise<Personenkontext<true>[] | PersonenkontexteUpdateError> {
        const sentPKs: Personenkontext<true>[] | PersonenkontexteUpdateError = await this.getSentPersonenkontexte();
        if (sentPKs instanceof PersonenkontexteUpdateError) {
            return sentPKs;
        }

        const existingPKs: Personenkontext<true>[] = await this.dBiamPersonenkontextRepo.findByPerson(this.personId);
        const validationError: Option<PersonenkontexteUpdateError> = await this.validate(existingPKs);
        if (validationError) {
            return validationError;
        }

        await this.delete(existingPKs, sentPKs);
        await this.add(existingPKs, sentPKs);

        const existingPKsAfterUpdate: Personenkontext<true>[] = await this.dBiamPersonenkontextRepo.findByPerson(
            this.personId,
        );

        return existingPKsAfterUpdate;
    }
}
