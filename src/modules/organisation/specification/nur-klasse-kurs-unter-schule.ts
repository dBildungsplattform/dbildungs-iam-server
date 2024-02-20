import { CompositeSpecification } from '../../specification/specifications.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationRepo } from '../persistence/organisation.repo.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';

export class NurKlasseKursUnterSchule extends CompositeSpecification<OrganisationDo<true>> {
    public constructor(private readonly organisationRepo: OrganisationRepo) {
        super();
    }

    public async isSatisfiedBy(t: OrganisationDo<true>): Promise<boolean> {
        //if type is future type KLASSE or KURS
        if (
            t.typ === OrganisationsTyp.TRAEGER ||
            t.typ === OrganisationsTyp.SCHULE ||
            t.typ === OrganisationsTyp.SONSTIGE ||
            t.typ === OrganisationsTyp.UNBEST ||
            t.typ === OrganisationsTyp.ANBIETER
        ) {
            return (await this.validateAdministriertVon(t)) && (await this.validateZugehoerigZu(t));
        }
        return true;
    }

    private async validateAdministriertVon(t: OrganisationDo<true>): Promise<boolean> {
        if (!t.administriertVon) return true;
        const parent: Option<OrganisationDo<true>> = await this.organisationRepo.findById(t.administriertVon);
        if (!parent) return true;
        return !(parent.typ === OrganisationsTyp.SCHULE);
    }

    private async validateZugehoerigZu(t: OrganisationDo<true>): Promise<boolean> {
        if (!t.zugehoerigZu) return true;
        const parent: Option<OrganisationDo<true>> = await this.organisationRepo.findById(t.zugehoerigZu);
        if (!parent) return true;
        return !(parent.typ === OrganisationsTyp.SCHULE);
    }
}
