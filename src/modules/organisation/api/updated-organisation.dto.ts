import { OrganisationsTyp, Traegerschaft } from '../domain/organisation.enums.js';

export class UpdatedOrganisationDto {
    public readonly id!: string;

    public readonly kennung?: string;

    public readonly name!: string;

    public readonly namensergaenzung?: string;

    public readonly kuerzel?: string;

    public readonly typ!: OrganisationsTyp;

    public traegerschaft?: Traegerschaft;

    public readonly administriertVon?: string;

    public readonly zugehoerigZu?: string;
}
