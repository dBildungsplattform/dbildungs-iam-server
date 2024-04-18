import { CompositeSpecification } from '../../specification/specifications.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';

export class GleicheRolleAnKlasseWieSchule extends CompositeSpecification<Personenkontext<boolean>> {
    public constructor(
        private readonly organisationRepo: OrganisationRepo,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly rolleRepo: RolleRepo,
    ) {
        super();
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async isSatisfiedBy(p: Personenkontext<boolean>): Promise<boolean> {
        const organisation: Option<OrganisationDo<true>> = await this.organisationRepo.findById(p.organisationId);
        if (!organisation) return false;
        if (organisation.typ !== OrganisationsTyp.KLASSE) return true;
        if (!organisation.administriertVon) return false; // Klasse always has to be administered by Schule

        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(p.rolleId);
        if (!rolle) return false;

        const schule: Option<OrganisationDo<true>> = await this.organisationRepo.findById(
            organisation.administriertVon,
        );
        if (!schule) return false;

        const personenKontexte: Personenkontext<true>[] = await this.dBiamPersonenkontextRepo.findByPerson(p.personId);

        for (const pk of personenKontexte) {
            if (pk.organisationId === schule.id) {
                const rolleAnSchule: Option<Rolle<true>> = await this.rolleRepo.findById(pk.rolleId);
                if (!rolleAnSchule) return false;
                if (rolleAnSchule.rollenart === rolle.rollenart) {
                    return true;
                }
            }
        }
        return false;
    }
}
