import { PersonNameParams } from './person-name.params.js';
import { PersonBirthParams } from './person-birth.params.js';
import { Vertrauensstufe } from '../domain/person.enums.js';

export class PersonResponse {
    public id!: string;

    public referrer?: string;

    public mandant: string = '';

    public name!: PersonNameParams;

    public geburt?: PersonBirthParams;

    public readonly stammorganisation?: string;

    public geschlecht?: string;

    public lokalisierung?: string;

    public vertrauensstufe?: Vertrauensstufe;

    public revision!: string;

    public startpasswort?: string;
}
