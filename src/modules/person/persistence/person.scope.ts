import { EntityName } from '@mikro-orm/core';
import { ScopeBase, ScopeOperator } from '../../../shared/persistence/index.js';
import { PersonEntity } from './person.entity.js';

type FindProps = {
    firstName?: string;
    lastName?: string;
    birthDate?: Date;
};

export class PersonScope extends ScopeBase<PersonEntity> {
    public override get entityName(): EntityName<PersonEntity> {
        return PersonEntity;
    }

    public findBy(findProps: FindProps, operator: ScopeOperator = ScopeOperator.AND): this {
        this.findByInternal(
            {
                firstName: findProps.firstName,
                lastName: findProps.lastName,
                birthDate: findProps.birthDate,
            },
            operator,
        );

        return this;
    }
}
