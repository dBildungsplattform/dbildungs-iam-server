import { AutoMap } from '@automapper/classes';
import { OrganisationsTyp } from '../domain/organisation.enum.js';

export class CreateOrganisationDto {
    @AutoMap()
    public readonly verwaltetVon?: string;

    @AutoMap()
    public readonly zugehoerigZu?: string;

    @AutoMap()
    public readonly kennung!: string;

    @AutoMap()
    public readonly name!: string;

    @AutoMap()
    public readonly namensergaenzung!: string;

    @AutoMap()
    public readonly kuerzel!: string;

    @AutoMap(() => String)
    public readonly typ!: OrganisationsTyp;
}
