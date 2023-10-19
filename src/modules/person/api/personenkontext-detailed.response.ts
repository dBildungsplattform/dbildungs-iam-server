import { AutoMap } from '@automapper/classes';
import { Rolle, Personenstatus, Jahrgangsstufe } from '../domain/personenkontext.enums.js';
import { CreatedPersonenkontextOrganisationDto } from './created-personenkontext-organisation.dto.js';
import { ApiProperty } from '@nestjs/swagger';
import { SichtfreigabeType } from './personen-query.param.js';
import { LoeschungDto } from './loeschung.dto.js';

export class PersonenkontextDetailedResponse {
    @AutoMap()
    @ApiProperty()
    public readonly id!: string;

    @AutoMap()
    @ApiProperty()
    public readonly referrer?: string;

    @AutoMap()
    @ApiProperty()
    public readonly mandant!: string;

    @AutoMap()
    @ApiProperty()
    public readonly organisation!: CreatedPersonenkontextOrganisationDto;

    @AutoMap(() => String)
    @ApiProperty()
    public readonly rolle!: Rolle;

    @AutoMap(() => String)
    @ApiProperty()
    public readonly personenstatus?: Personenstatus;

    @AutoMap(() => String)
    @ApiProperty()
    public readonly jahrgangsstufe?: Jahrgangsstufe;

    @AutoMap(() => String)
    @ApiProperty()
    public readonly sichtfreigabe?: SichtfreigabeType;

    @AutoMap(() => LoeschungDto)
    @ApiProperty()
    public readonly loeschung?: LoeschungDto;

    @AutoMap()
    @ApiProperty()
    public readonly revision!: string;
}
