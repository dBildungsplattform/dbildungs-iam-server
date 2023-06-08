import { DOBase } from '../../shared/index.js';
import { PersonEntity } from './person.entity.js';

export class PersonDO extends DOBase<PersonEntity> {
    public constructor(props: PersonEntity) {
        super(props);
    }
}
