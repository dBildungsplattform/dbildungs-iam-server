import { AutoMap } from '@automapper/classes';
import { Jahrgangsstufe, Personenstatus, Rolle, SichtfreigabeType } from '../../person/domain/personenkontext.enums.js';
import { CreatedPersonenkontextOrganisationDto } from './created-personenkontext-organisation.dto.js';
import { LoeschungDto } from '../../person/api/loeschung.dto.js';

export class PersonenkontextDto {
    @AutoMap()
    public readonly id!: string;

    @AutoMap()
    public readonly personId!: string;

    @AutoMap()
    public readonly referrer?: string;

    @AutoMap()
    public readonly mandant!: string;

    @AutoMap(() => CreatedPersonenkontextOrganisationDto)
    public readonly organisation!: CreatedPersonenkontextOrganisationDto;

    @AutoMap(() => String)
    public readonly rolle!: Rolle;

    @AutoMap(() => String)
    public readonly personenstatus?: Personenstatus;

    @AutoMap(() => String)
    public readonly jahrgangsstufe?: Jahrgangsstufe;

    @AutoMap(() => String)
    public readonly sichtfreigabe?: SichtfreigabeType;

    @AutoMap(() => LoeschungDto)
    public readonly loeschung?: LoeschungDto;

    @AutoMap()
    public readonly revision!: string;
}
