import { OrganisationsTyp, Traegerschaft } from '../../../modules/organisation/domain/organisation.enums.js';

export class OrganisationFile {
    public id!: string;

    public administriertVon?: string;

    public zugehoerigZu?: string;

    public kennung?: string;

    public name?: string;

    public namensergaenzung?: string;

    public kuerzel?: string;

    public typ?: OrganisationsTyp;

    public traegerschaft?: Traegerschaft;
}
