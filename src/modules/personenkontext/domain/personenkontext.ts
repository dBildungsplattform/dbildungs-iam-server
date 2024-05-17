import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { OrganisationID, PersonID, RolleID } from '../../../shared/types/index.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';

export class Personenkontext<WasPersisted extends boolean> {
    private constructor(
        private readonly personRepo: PersonRepo,
        private readonly organisationRepo: OrganisationRepo,
        private readonly rolleRepo: RolleRepo,
        public id: Persisted<string, WasPersisted>,
        public readonly createdAt: Persisted<Date, WasPersisted>,
        public readonly updatedAt: Persisted<Date, WasPersisted>,
        public readonly personId: PersonID,
        public readonly organisationId: OrganisationID,
        public readonly rolleId: RolleID,
    ) {}

    public static construct<WasPersisted extends boolean = false>(
        personRepo: PersonRepo,
        organisationRepo: OrganisationRepo,
        rolleRepo: RolleRepo,
        id: Persisted<string, WasPersisted>,
        createdAt: Persisted<Date, WasPersisted>,
        updatedAt: Persisted<Date, WasPersisted>,
        personId: PersonID,
        organisationId: OrganisationID,
        rolleId: RolleID,
    ): Personenkontext<WasPersisted> {
        return new Personenkontext(
            personRepo,
            organisationRepo,
            rolleRepo,
            id,
            createdAt,
            updatedAt,
            personId,
            organisationId,
            rolleId,
        );
    }

    public static async createNew(
        personRepo: PersonRepo,
        organisationRepo: OrganisationRepo,
        rolleRepo: RolleRepo,
        personId: PersonID,
        organisationId: OrganisationID,
        rolleId: RolleID,
    ): Promise<Personenkontext<false> | DomainError> {
        const personenkontext: Personenkontext<false> = new Personenkontext(
            personRepo,
            organisationRepo,
            rolleRepo,
            undefined,
            undefined,
            undefined,
            personId,
            organisationId,
            rolleId,
        );

        const referenceError: Option<DomainError> = await personenkontext.checkReferences();

        if (referenceError) {
            return referenceError;
        }

        return personenkontext;
    }

    public async checkReferences(): Promise<Option<DomainError>> {
        const referencesExist: [boolean, boolean, boolean] = await Promise.all([
            this.personRepo.exists(this.personId),
            this.organisationRepo.exists(this.organisationId),
            this.rolleRepo.exists(this.rolleId),
        ]);

        if (!referencesExist[0]) {
            return new EntityNotFoundError('Person', this.personId);
        }

        if (!referencesExist[1]) {
            return new EntityNotFoundError('Organisation', this.organisationId);
        }

        if (!referencesExist[2]) {
            return new EntityNotFoundError('Rolle', this.rolleId);
        }

        return undefined;
    }

    public async checkRolleZuweisungPermissions(permissions: PersonPermissions): Promise<Option<DomainError>> {
        let orgas: OrganisationID[] | undefined = await permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.PERSONEN_VERWALTEN],
            true,
        );

        // If user has permission on root orga, allow everything
        if (orgas.includes(this.organisationRepo.ROOT_ORGANISATION_ID)) {
            orgas = undefined;
        }

        // Missing permission on orga
        if (orgas && !orgas.includes(this.organisationId)) {
            return new MissingPermissionsError('Unauthorized to manage persons at the organisation');
        }

        // Can rolle be assigned at target orga
        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(this.rolleId);
        if (!rolle) {
            return new EntityNotFoundError('rolle', this.rolleId);
        }
        const rollenOrgas: Organisation<true>[] = await this.organisationRepo.findChildOrgasForIds([
            rolle.administeredBySchulstrukturknoten,
        ]);
        const rollenOrgaIds: OrganisationID[] = rollenOrgas.map((orga: Organisation<true>) => orga.id);
        rollenOrgaIds.push(rolle.administeredBySchulstrukturknoten);
        if (!rollenOrgaIds.includes(this.organisationId)) {
            return new EntityNotFoundError(''); // TODO: Can't assign rolle at this organisation error
        }

        return undefined;
    }
}
