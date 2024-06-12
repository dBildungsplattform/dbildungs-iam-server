import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { OrganisationMatchesRollenart } from '../specification/organisation-matches-rollenart.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';

export class PersonenkontextAnlage {
    //public organisationId?: string;

    //public rolleId?: string;

    private constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepo: OrganisationRepo,
    ) {}

    public static createNew(rolleRepo: RolleRepo, organisationRepo: OrganisationRepo): PersonenkontextAnlage {
        return new PersonenkontextAnlage(rolleRepo, organisationRepo);
    }

    public async findSchulstrukturknoten(
        personPermissions: PersonPermissions,
        rolleId: string,
        sskName: string,
        limit?: number,
        excludeKlassen: boolean = false,
    ): Promise<OrganisationDo<true>[]> {
        //this.rolleId = rolleId;

        const orgIdsWithPersonenVerwalten: string[] = await personPermissions.getOrgIdsWithSystemrecht([
            RollenSystemRecht.PERSONEN_VERWALTEN,
        ]);

        let ssks: Option<OrganisationDo<true>[]> = await this.organisationRepo.findByNameOrKennung(sskName);
        ssks = ssks.filter((ssk: OrganisationDo<true>) =>
            orgIdsWithPersonenVerwalten.some((orgId: string) => ssk.id === orgId),
        );

        if (ssks.length === 0) return [];

        const rolleResult: Option<Rolle<true>> = await this.rolleRepo.findById(rolleId);
        if (!rolleResult) return [];

        const allOrganisations: OrganisationDo<true>[] = [];

        const parentOrganisation: Option<OrganisationDo<true>> = await this.organisationRepo.findById(
            rolleResult.administeredBySchulstrukturknoten,
        );
        if (!parentOrganisation) return [];
        allOrganisations.push(parentOrganisation);

        const childOrganisations: OrganisationDo<true>[] = await this.organisationRepo.findChildOrgasForIds([
            rolleResult.administeredBySchulstrukturknoten,
        ]);
        allOrganisations.push(...childOrganisations);

        let orgas: OrganisationDo<true>[] = ssks.filter((ssk: OrganisationDo<true>) =>
            allOrganisations.some((organisation: OrganisationDo<true>) => ssk.id === organisation.id),
        );

        if (excludeKlassen) {
            orgas = orgas.filter((ssk: OrganisationDo<true>) => ssk.typ !== OrganisationsTyp.KLASSE);
        }

        const organisationMatchesRollenart: OrganisationMatchesRollenart = new OrganisationMatchesRollenart();
        orgas = orgas.filter((orga: OrganisationDo<true>) =>
            organisationMatchesRollenart.isSatisfiedBy(orga, rolleResult),
        );

        return orgas.slice(0, limit);
    }

    public async findRollen(rolleName: string, limit?: number): Promise<Rolle<true>[]> {
        const rollen: Option<Rolle<true>[]> = await this.rolleRepo.findByName(rolleName, limit);
        if (rollen) return rollen;
        return [];
    }
}
