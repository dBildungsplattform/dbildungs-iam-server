import { AutoMap } from '@automapper/classes';
import { Jahrgangsstufe, Personenstatus, Rolle, SichtfreigabeType } from '../domain/personenkontext.enums.js';
import { SavedPersonenkontextOrganisationDto } from './saved-personenkontext-organisation.dto.js';
import { LoeschungDto } from './loeschung.dto.js';

export class SavedPersonenkontextDto {
    @AutoMap()
    public readonly id!: string;

    @AutoMap()
    public readonly referrer?: string;

    @AutoMap()
    public readonly mandant!: string;

    @AutoMap()
    public readonly organisation!: SavedPersonenkontextOrganisationDto;

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
