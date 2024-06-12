import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { OrganisationMatchesRollenart } from '../specification/organisation-matches-rollenart.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OrganisationID } from '../../../shared/types/aggregate-ids.types.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';

export class PersonenkontextAnlage {
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
        const orgsWithRecht: string[] = await personPermissions.getOrgIdsWithSystemrecht([
            RollenSystemRecht.PERSONEN_VERWALTEN,
        ]);

        let ssks: Option<OrganisationDo<true>[]> = await this.organisationRepo.findByNameOrKennung(sskName);

        //Landesadmin can view all roles, if not orgsWithRecht includes ROOT, filter the ssks
        if (!orgsWithRecht.includes(this.organisationRepo.ROOT_ORGANISATION_ID)) {
            ssks = ssks.filter((ssk: OrganisationDo<true>) => orgsWithRecht.some((orgId: string) => ssk.id === orgId));
        }

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

    public async findAuthorizedRollen(
        permissions: PersonPermissions,
        rolleName?: string,
        limit?: number,
    ): Promise<Rolle<true>[]> {
        let rollen: Option<Rolle<true>[]>;

        if (rolleName) {
            rollen = await this.rolleRepo.findByName(rolleName, limit);
        } else {
            rollen = await this.rolleRepo.find(limit);
        }

        if (!rollen) return [];

        const orgsWithRecht: OrganisationID[] = await permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.PERSONEN_VERWALTEN],
            true,
        );

        //Landesadmin can view all roles.
        if (orgsWithRecht.includes(this.organisationRepo.ROOT_ORGANISATION_ID)) return rollen;

        const allowedRollen: Rolle<true>[] = [];
        const organisationMatchesRollenart: OrganisationMatchesRollenart = new OrganisationMatchesRollenart();
        (await this.organisationRepo.findByIds(orgsWithRecht)).forEach(function (orga: OrganisationDo<true>) {
            rollen.forEach(function (rolle: Rolle<true>) {
                if (organisationMatchesRollenart.isSatisfiedBy(orga, rolle) && !allowedRollen.includes(rolle)) {
                    allowedRollen.push(rolle);
                }
            });
        });

        return allowedRollen;
    }
}
