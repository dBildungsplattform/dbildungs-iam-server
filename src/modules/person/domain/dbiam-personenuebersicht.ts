import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { PersonRepository } from '../persistence/person.repository.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { Person } from './person.js';
import { EntityNotFoundError } from '../../../shared/error/index.js';
import { OrganisationID, PersonID, RolleID } from '../../../shared/types/index.js';
import { RollenArt, RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { DBiamPersonenzuordnungResponse } from '../api/personenuebersicht/dbiam-personenzuordnung.response.js';
import { DBiamPersonenuebersichtResponse } from '../api/personenuebersicht/dbiam-personenuebersicht.response.js';
import { PermittedOrgas, PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { DataConfig, ServerConfig } from '../../../shared/config/index.js';
import { ConfigService } from '@nestjs/config';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Organisation } from '../../organisation/domain/organisation.js';

export class DbiamPersonenuebersicht {
    public readonly ROOT_ORGANISATION_ID: string;

    private constructor(
        private readonly personRepository: PersonRepository,
        private readonly dbiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly organisationRepository: OrganisationRepository,
        private readonly rolleRepo: RolleRepo,
        config: ConfigService<ServerConfig>,
    ) {
        this.ROOT_ORGANISATION_ID = config.getOrThrow<DataConfig>('DATA').ROOT_ORGANISATION_ID;
    }

    public static createNew(
        personRepository: PersonRepository,
        dbiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        organisationRepository: OrganisationRepository,
        rolleRepo: RolleRepo,
        configService: ConfigService<ServerConfig>,
    ): DbiamPersonenuebersicht {
        return new DbiamPersonenuebersicht(
            personRepository,
            dbiamPersonenkontextRepo,
            organisationRepository,
            rolleRepo,
            configService,
        );
    }

    public async getPersonenkontexte(
        personId: PersonID,
        permissions: PersonPermissions,
    ): Promise<DBiamPersonenuebersichtResponse | EntityNotFoundError> {
        const person: Option<Person<true>> = await this.personRepository.findById(personId);
        if (!person) {
            return new EntityNotFoundError('Person', personId);
        }
        // Find all organisations where user has permission
        const permittedOrgas: PermittedOrgas = await permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.PERSONEN_VERWALTEN],
            true,
        );

        const personenKontexte: Personenkontext<true>[] = await this.dbiamPersonenkontextRepo.findByPerson(personId);
        const rollenIdsForKontexte: RolleID[] = personenKontexte.map(
            (kontext: Personenkontext<true>) => kontext.rolleId,
        );
        const organisationIdsForKontexte: OrganisationID[] = personenKontexte.map(
            (kontext: Personenkontext<true>) => kontext.organisationId,
        );
        const rollenForKontexte: Map<string, Rolle<true>> = await this.rolleRepo.findByIds(rollenIdsForKontexte);
        const organisationsForKontexte: Map<string, Organisation<true>> = await this.organisationRepository.findByIds(
            organisationIdsForKontexte,
        ); //use Organisation Aggregate as soon as there is one

        const result: [DBiamPersonenzuordnungResponse[], Date?] | EntityNotFoundError =
            await this.createZuordnungenForKontexte(
                personenKontexte,
                rollenForKontexte,
                organisationsForKontexte,
                permittedOrgas.all ? undefined : permittedOrgas.orgaIds,
            );
        if (result instanceof EntityNotFoundError) {
            return result;
        }

        return new DBiamPersonenuebersichtResponse(person, result[0], result[1]);
    }

    public async createZuordnungenForKontexte(
        kontexte: Personenkontext<true>[],
        rollen: Map<string, Rolle<true>>,
        organisations: Map<string, Organisation<true>>,
        organisationIds?: string[],
    ): Promise<[DBiamPersonenzuordnungResponse[], Date?] | EntityNotFoundError> {
        const personenUebersichtenPromises: Promise<DBiamPersonenzuordnungResponse>[] = [];
        let lastModifiedZuordnungen: Date | undefined = undefined;

        for (const pk of kontexte) {
            const rolle: Rolle<true> | undefined = rollen.get(pk.rolleId);
            const organisation: Organisation<true> | undefined = organisations.get(pk.organisationId);

            if (!rolle) {
                return new EntityNotFoundError('Rolle', pk.rolleId);
            }
            if (!organisation) {
                return new EntityNotFoundError('Organisation', pk.organisationId);
            }

            const hasAccess: boolean =
                organisationIds === undefined || organisationIds.some((orgaId: string) => orgaId === organisation.id);

            const zuordnungPromise: Promise<DBiamPersonenzuordnungResponse> =
                (async (): Promise<DBiamPersonenzuordnungResponse> => {
                    let admins: string[] | undefined = undefined;
                    if (rolle.rollenart !== RollenArt.LEIT) {
                        admins = await this.personRepository.findOrganisationAdminsByOrganisationId(pk.organisationId);
                    }

                    return new DBiamPersonenzuordnungResponse(pk, organisation, rolle, hasAccess, admins);
                })();

            personenUebersichtenPromises.push(zuordnungPromise);

            if (!lastModifiedZuordnungen || lastModifiedZuordnungen.getTime() < pk.updatedAt.getTime()) {
                lastModifiedZuordnungen = pk.updatedAt;
            }
        }

        const personenUebersichten: DBiamPersonenzuordnungResponse[] = await Promise.all(personenUebersichtenPromises);

        return [personenUebersichten, lastModifiedZuordnungen];
    }
}
