import { AutoMap } from '@automapper/classes';
import { OrganisationsTyp } from '../domain/organisation.enum.js';

export class CreatedOrganisationDto {
    @AutoMap()
    public readonly id!: string;

    @AutoMap()
    public readonly kennung!: string;

    @AutoMap()
    public readonly name!: string;

    @AutoMap()
    public readonly namensergaenzung!: string;

    @AutoMap()
    public readonly kuerzel!: string;

    @AutoMap()
    public readonly typ!: OrganisationsTyp;
}
