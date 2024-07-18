import { DomainError } from '../../../shared/error/domain.error.js';
import { OrganisationID, PersonID, RolleID } from '../../../shared/types/index.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Person } from '../../person/domain/person.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { IPersonPermissions } from './person-permissions.interface.js';
import { PersonPermissionsMock } from './person-permissions.mock.js';

export type PersonFields = Pick<
    Person<true>,
    | 'id'
    | 'keycloakUserId'
    | 'vorname'
    | 'familienname'
    | 'rufname'
    | 'username'
    | 'geschlecht'
    | 'geburtsdatum'
    | 'updatedAt'
>;
type PersonKontextFields = Pick<Personenkontext<true>, 'rolleId' | 'organisationId'>;
type RolleFields = Pick<Rolle<true>, 'systemrechte' | 'serviceProviderIds'>;
export type PersonenkontextRolleFields = {
    organisationsId: OrganisationID;
    rolle: RolleFields;
};

export class PersonPermissions implements IPersonPermissions {
    public static ALL: IPersonPermissions = new PersonPermissionsMock();

    private cachedPersonenkontextsFields?: PersonKontextFields[];

    private cachedPersonFields: PersonFields;

    private cachedRollenFields?: PersonenkontextRolleFields[];

    public constructor(
        private personenkontextRepo: DBiamPersonenkontextRepo,
        private organisationRepo: OrganisationRepository,
        private rolleRepo: RolleRepo,
        person: Person<true>,
    ) {
        this.cachedPersonFields = {
            id: person.id,
            keycloakUserId: person.keycloakUserId,
            vorname: person.vorname,
            familienname: person.familienname,
            rufname: person.rufname,
            username: person.username,
            geschlecht: person.geschlecht,
            geburtsdatum: person.geburtsdatum,
            updatedAt: person.updatedAt,
        };
    }

    public async getRoleIds(): Promise<RolleID[]> {
        const personKontextFields: PersonKontextFields[] = await this.getPersonenkontextsFields();

        return personKontextFields.map((personenkontextFields: PersonKontextFields) => {
            return personenkontextFields.rolleId;
        });
    }

    public async getOrgIdsWithSystemrecht(
        systemrechte: RollenSystemRecht[],
        withChildren: boolean = false,
    ): Promise<OrganisationID[]> {
        const organisationIDs: Set<OrganisationID> = new Set();

        const personKontextFields: PersonKontextFields[] = await this.getPersonenkontextsFields();
        const rollen: Map<RolleID, Rolle<true>> = await this.rolleRepo.findByIds(
            personKontextFields.map((pk: PersonKontextFields) => pk.rolleId),
        );

        for (const pk of personKontextFields) {
            const rolle: Rolle<true> | undefined = rollen.get(pk.rolleId);
            if (rolle && systemrechte.every((r: RollenSystemRecht) => rolle.hasSystemRecht(r))) {
                organisationIDs.add(pk.organisationId);
            }
        }

        if (withChildren) {
            const childOrgas: OrganisationDo<true>[] = await this.organisationRepo.findChildOrgasForIds(
                Array.from(organisationIDs),
            );

            childOrgas.forEach((orga: OrganisationDo<true>) => organisationIDs.add(orga.id));
        }

        return Array.from(organisationIDs);
    }

    public async hasSystemrechtAtOrganisation(
        organisationId: OrganisationID,
        systemrechte: RollenSystemRecht[],
    ): Promise<boolean> {
        const orgsWithRecht: OrganisationID[] = await this.getOrgIdsWithSystemrecht(systemrechte, true);

        return orgsWithRecht.includes(organisationId);
    }

    public async hasSystemrechtAtRootOrganisation(systemrechte: RollenSystemRecht[]): Promise<boolean> {
        const orgsWithRecht: OrganisationID[] = await this.getOrgIdsWithSystemrecht(systemrechte, true);

        return orgsWithRecht.includes(this.organisationRepo.ROOT_ORGANISATION_ID);
    }

    public async canModifyPerson(personId: PersonID): Promise<boolean> {
        {
            const hasModifyRechtAtRoot: boolean = await this.hasSystemrechtAtRootOrganisation([
                RollenSystemRecht.PERSONEN_VERWALTEN,
            ]);

            if (hasModifyRechtAtRoot) {
                return true;
            }
        }

        {
            const result: Result<Personenkontext<true>[], DomainError> =
                await this.personenkontextRepo.findByPersonAuthorized(personId, this);

            if (!result.ok) {
                return false;
            }

            return result.value.length > 0;
        }
    }

    private async getPersonenkontextsFields(): Promise<PersonKontextFields[]> {
        if (!this.cachedPersonenkontextsFields) {
            const personenkontexte: Personenkontext<true>[] = await this.personenkontextRepo.findByPerson(
                this.personFields.id,
            );
            this.cachedPersonenkontextsFields = personenkontexte.map((personenkontext: Personenkontext<true>) => ({
                rolleId: personenkontext.rolleId,
                organisationId: personenkontext.organisationId,
            }));
        }

        return this.cachedPersonenkontextsFields;
    }

    public async getPersonenkontextewithRoles(): Promise<PersonenkontextRolleFields[]> {
        if (!this.cachedRollenFields) {
            const personKontextFields: PersonKontextFields[] = await this.getPersonenkontextsFields();
            const rollen: Map<RolleID, Rolle<true>> = await this.rolleRepo.findByIds(
                personKontextFields.map((pk: PersonKontextFields) => pk.rolleId),
            );

            this.cachedRollenFields = [];

            for (const pk of personKontextFields) {
                const rolle: Rolle<true> | undefined = rollen.get(pk.rolleId);
                if (rolle) {
                    this.cachedRollenFields.push({
                        organisationsId: pk.organisationId,
                        rolle: {
                            systemrechte: rolle.systemrechte,
                            serviceProviderIds: rolle.serviceProviderIds,
                        },
                    });
                }
            }
        }

        return this.cachedRollenFields;
    }

    public get personFields(): PersonFields {
        return this.cachedPersonFields;
    }
}
