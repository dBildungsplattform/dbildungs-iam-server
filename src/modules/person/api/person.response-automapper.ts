import { ApiProperty } from '@nestjs/swagger';
import { PersonNameParams } from './person-name.params.js';

export class PersonResponseAutomapper {
    @ApiProperty()
    public id!: string;

    @ApiProperty()
    public referrer?: string;

    @ApiProperty()
    public mandant: string = '';

    @ApiProperty({ type: PersonNameParams })
    public name!: PersonNameParams;

    @ApiProperty()
    public readonly stammorganisation?: string;

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
        this.stammorganisation = props.stammorganisation;
        this.revision = props.revision!;
        this.startpasswort = props.startpasswort;
        this.personalnummer = props.personalnummer;
    }
}
