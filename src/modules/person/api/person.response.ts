import { PersonNameParams } from './person-name.params.js';
import { PersonBirthParams } from './person-birth.params.js';
import { Vertrauensstufe } from '../domain/person.enums.js';
import { ApiProperty } from '@nestjs/swagger';

export class PersonResponse {
    @ApiProperty()
    public id!: string;

    @ApiProperty()
    public referrer?: string;

    @ApiProperty()
    public mandant: string = '';

    @ApiProperty({ type: PersonNameParams })
    public name!: PersonNameParams;

    @ApiProperty({ type: PersonBirthParams })
    public geburt?: PersonBirthParams;

    @ApiProperty()
    public readonly stammorganisation?: string;

    @ApiProperty()
    public geschlecht?: string;

    @ApiProperty()
    public lokalisierung?: string;

    @ApiProperty({ enum: Vertrauensstufe })
    public vertrauensstufe?: Vertrauensstufe;

    @ApiProperty()
    public revision!: string;

    @ApiProperty({ description: 'Initiales Benutzerpasswort, muss nach der ersten Anmeldung geändert werden' })
    public startpasswort?: string;
}
