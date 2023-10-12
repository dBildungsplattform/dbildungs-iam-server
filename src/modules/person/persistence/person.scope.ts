import { EntityName } from '@mikro-orm/core';
import { ScopeBase, ScopeOperator } from '../../../shared/persistence/index.js';
import { PersonEntity } from './person.entity.js';

type SearchProps = {
    firstName?: string;
    lastName?: string;
    birthDate?: Date;
};

export class PersonScope extends ScopeBase<PersonEntity> {
    public override get entityName(): EntityName<PersonEntity> {
        return PersonEntity;
    }

    public searchBy(searchProps: SearchProps): this {
        this.findBy(
            {
                firstName: searchProps.firstName,
                lastName: searchProps.lastName,
                birthDate: searchProps.birthDate,
            },
            ScopeOperator.AND,
        );

        return this;
    }
}
