import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { Jahrgangsstufe, Personenstatus, Rolle, SichtfreigabeType } from '../domain/personenkontext.enums.js';
import { CreatedPersonenkontextOrganisationDto } from './created-personenkontext-organisation.dto.js';
import { LoeschungResponse } from './loeschung.response.js';

export class PersonenkontextResponse {
    @AutoMap()
    @ApiProperty()
    public readonly id!: string;

    @AutoMap()
    @ApiProperty()
    public readonly referrer?: string;

    @AutoMap()
    @ApiProperty()
    public readonly mandant!: string;

    @AutoMap(() => CreatedPersonenkontextOrganisationDto)
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

    @AutoMap(() => LoeschungResponse)
    @ApiProperty()
    public readonly loeschung?: LoeschungResponse;

    @AutoMap()
    @ApiProperty()
    public readonly revision!: string;
}
