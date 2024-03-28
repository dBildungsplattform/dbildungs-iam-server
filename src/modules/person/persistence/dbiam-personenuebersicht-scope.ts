import { EntityName } from '@mikro-orm/core';
import { ScopeBase, ScopeOperator } from '../../../shared/persistence/index.js';
import { PersonEntity } from './person.entity.js';

type FindProps = object;

export class DbiamPersonenuebersichtScope extends ScopeBase<PersonEntity> {
    public override get entityName(): EntityName<PersonEntity> {
        return PersonEntity;
    }

    public findBy(_findProps: Findable<FindProps>, operator: ScopeOperator = ScopeOperator.AND): this {
        this.findByInternal({}, operator);

        return this; // no filtering in ticket SPSH-488
    }
}
