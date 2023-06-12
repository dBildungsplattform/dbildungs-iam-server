import { DOBase as DoBase } from '../../shared/index.js';
import { PersonEntity } from './person.entity.js';

export class PersonDo extends DoBase<PersonEntity> {
    public constructor(props: PersonEntity) {
        super(props);
    }
}
