import { AutoMap } from '@automapper/classes';
import { PersonDto } from './person.dto.js';
import { PersonenkontextDto } from './personenkontext.dto.js';

export class PersonendatensatzDto {
    @AutoMap(() => PersonDto)
    public readonly person!: PersonDto;

    @AutoMap(() => [PersonenkontextDto])
    public readonly personenkontexte!: PersonenkontextDto[];

    public constructor(props: Readonly<PersonendatensatzDto>) {
        Object.assign(this, props);
    }
}
