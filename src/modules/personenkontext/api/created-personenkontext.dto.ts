import { AutoMap } from '@automapper/classes';
import { Jahrgangsstufe, Personenstatus, Rolle, SichtfreigabeType } from '../domain/personenkontext.enums.js';
import { CreatedPersonenkontextOrganisation } from './created-personenkontext-organisation.js';
import { LoeschungDto } from '../../person/api/loeschung.dto.js';

export class CreatedPersonenkontextDto {
    @AutoMap()
    public readonly id!: string;

    @AutoMap()
    public readonly referrer?: string;

    @AutoMap()
    public readonly mandant!: string;

    @AutoMap()
    public readonly organisation!: CreatedPersonenkontextOrganisation;

    @AutoMap()
    public readonly rolle!: Rolle;

    @AutoMap()
    public readonly personenstatus?: Personenstatus;

    @AutoMap()
    public readonly jahrgangsstufe?: Jahrgangsstufe;

    @AutoMap(() => String)
    public readonly sichtfreigabe?: SichtfreigabeType;

    @AutoMap(() => LoeschungDto)
    public readonly loeschung?: LoeschungDto;

    @AutoMap()
    public readonly revision!: string;
}
