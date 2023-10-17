import { AutoMap } from '@automapper/classes';
import { Rolle, Personenstatus, Jahrgangsstufe } from '../domain/personenkontext.enums.js';
import { CreatedPersonenkontextOrganisationDto } from './created-personenkontext-organisation.dto.js';

export class PersonenkontextResponse {
    @AutoMap()
    public readonly id!: string;

    @AutoMap()
    public readonly referrer?: string;

    @AutoMap()
    public readonly mandant!: string;

    @AutoMap()
    public readonly organisation!: CreatedPersonenkontextOrganisationDto;

    @AutoMap()
    public readonly rolle!: Rolle;

    @AutoMap()
    public readonly personenstatus?: Personenstatus;

    @AutoMap()
    public readonly jahrgangsstufe?: Jahrgangsstufe;

    @AutoMap()
    public readonly revision!: string;
}
