import { RolleID, OrganisationID } from '../../../shared/types/index.js';
import { Person } from '../../person/domain/person.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';

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

export class PersonPermissions {
    private cachedPersonenkontextsFields?: PersonKontextFields[];

    private cachedPersonFields: PersonFields;
    private cachedRollenFields?: RolleFields[];

    public constructor(
        private personenkontextRepo: DBiamPersonenkontextRepo,
        person: Person<true>,
        private rolleRepo: RolleRepo,
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

    public async getRoleIds(): Promise<{ rolleId: RolleID; organisationId: OrganisationID }[]> {
        if (!this.cachedPersonenkontextsFields) {
            const personenkontexte: Personenkontext<true>[] = await this.personenkontextRepo.findByPerson(
                this.cachedPersonFields.id,
            );
            this.cachedPersonenkontextsFields = personenkontexte.map((personenkontext: Personenkontext<true>) => ({
                rolleId: personenkontext.rolleId,
                organisationId: personenkontext.organisationId,
            }));
        }
        return this.cachedPersonenkontextsFields.map((personenkontextFields: PersonKontextFields) => {
            return {
                rolleId: personenkontextFields.rolleId,
                organisationId: personenkontextFields.organisationId,
            };
        });
    }

    public async getRollen(): Promise<RolleFields[]> {
        const roleIds = (await this.getRoleIds()).map((item) => item.rolleId);

        const rolesMap = await this.rolleRepo.findByIds(roleIds);

        this.cachedRollenFields = Array.from(rolesMap.values()).map((rolle) => ({
            systemrechte: rolle.systemrechte,
            serviceProviderIds: rolle.serviceProviderIds,
        }));

        return this.cachedRollenFields;
    }

    public get personFields(): PersonFields {
        return this.cachedPersonFields;
    }
    public get personKontextFields(): PersonKontextFields[] | undefined {
        return this.cachedPersonenkontextsFields;
    }
    public get RollenFields(): RolleFields[] | undefined {
        return this.cachedRollenFields;
    }
}
