import { Injectable } from '@nestjs/common';
import { OrganisationID, PersonID, RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { Personenkontext } from './personenkontext.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Jahrgangsstufe, Personenstatus, SichtfreigabeType } from './personenkontext.enums.js';

@Injectable()
export class PersonenkontextFactory {
    public constructor(
        private readonly personRepository: PersonRepository,
        private readonly organisationRepository: OrganisationRepository,
        private readonly rolleRepo: RolleRepo,
    ) {}

    public construct<WasPersisted extends boolean = false>(
        id: Persisted<string, WasPersisted>,
        createdAt: Persisted<Date, WasPersisted>,
        updatedAt: Persisted<Date, WasPersisted>,
        revision: Persisted<string, WasPersisted>,
        personId: PersonID,
        organisationId: OrganisationID,
        rolleId: RolleID,
        referrer?: string,
        mandant?: string,
        personenstatus?: Personenstatus,
        jahrgangsstufe?: Jahrgangsstufe,
        sichtfreigabe?: SichtfreigabeType,
        loeschungZeitpunkt?: Date,
    ): Personenkontext<WasPersisted> {
        return Personenkontext.construct(
            this.personRepository,
            this.organisationRepository,
            this.rolleRepo,
            id,
            createdAt,
            updatedAt,
            personId,
            organisationId,
            rolleId,
            referrer,
            mandant,
            personenstatus,
            jahrgangsstufe,
            sichtfreigabe,
            loeschungZeitpunkt,
            revision,
        );
    }

    public createNew(
        personId: PersonID,
        organisationId: OrganisationID,
        rolleId: RolleID,
        referrer: string | undefined = undefined,
        mandant: string | undefined = undefined,
        personenstatus: Personenstatus | undefined = undefined,
        jahrgangsstufe: Jahrgangsstufe | undefined = undefined,
        sichtfreigabe: SichtfreigabeType | undefined = undefined,
        loeschungZeitpunkt: Date | undefined = undefined,
    ): Personenkontext<false> {
        return Personenkontext.createNew(
            this.personRepository,
            this.organisationRepository,
            this.rolleRepo,
            personId,
            organisationId,
            rolleId,
            referrer,
            mandant,
            personenstatus,
            jahrgangsstufe,
            sichtfreigabe,
            loeschungZeitpunkt,
        );
    }
}
