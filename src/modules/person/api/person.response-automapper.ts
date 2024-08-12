import { ApiProperty } from '@nestjs/swagger';
import { PersonNameParams } from './person-name.params.js';
import { PersonBirthParams } from './person-birth.params.js';
import { Vertrauensstufe, VertrauensstufeTypName } from '../domain/person.enums.js';

export class PersonResponseAutomapper {
    @ApiProperty()
    public id!: string;

    @ApiProperty()
    public referrer?: string;

    @ApiProperty()
    public mandant: string = '';

    @ApiProperty({ type: PersonNameParams })
    public name!: PersonNameParams;

    @ApiProperty({ type: PersonBirthParams })
    public geburt!: PersonBirthParams;

    @ApiProperty()
    public readonly stammorganisation?: string;

    @ApiProperty()
    public geschlecht!: string;

    @ApiProperty()
    public lokalisierung!: string;

    @ApiProperty({ enum: Vertrauensstufe, enumName: VertrauensstufeTypName })
    public vertrauensstufe!: Vertrauensstufe;

    @ApiProperty()
    public revision!: string;

    @ApiProperty({ description: 'Initiales Benutzerpasswort, muss nach der ersten Anmeldung geändert werden' })
    public startpasswort?: string;

    @ApiProperty()
    public personalnummer?: string;

    public constructor(props: Partial<PersonResponseAutomapper>) {
        this.id = props.id!;
        this.referrer = props.referrer;
        this.mandant = props.mandant!;
        this.name = props.name!;
        this.geburt = props.geburt!;
        this.stammorganisation = props.stammorganisation;
        this.geschlecht = props.geschlecht!;
        this.lokalisierung = props.lokalisierung!;
        this.vertrauensstufe = props.vertrauensstufe!;
        this.revision = props.revision!;
        this.startpasswort = props.startpasswort;
        this.personalnummer = props.personalnummer;
    }
}
