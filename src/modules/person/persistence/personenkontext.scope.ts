import { EntityName } from '@mikro-orm/core';
import { ScopeBase } from '../../../shared/persistence/scope-base.js';
import { ScopeOperator } from '../../../shared/persistence/scope.enums.js';
import { Personenstatus, Rolle, SichtfreigabeType } from '../../person-kontext/domain/personenkontext.enums.js';
import { PersonenkontextEntity } from './personenkontext.entity.js';

type FindProps = {
    personId: string;
    referrer: string;
    rolle: Rolle;
    personenstatus: Personenstatus;
    sichtfreigabe: SichtfreigabeType;
};

export class PersonenkontextScope extends ScopeBase<PersonenkontextEntity> {
    public override get entityName(): EntityName<PersonenkontextEntity> {
        return PersonenkontextEntity;
    }

    public findBy(findProps: Findable<FindProps>, operator: ScopeOperator = ScopeOperator.AND): this {
        this.findByInternal(
            {
                personId: findProps.personId,
                referrer: findProps.referrer,
                rolle: findProps.rolle,
                personenstatus: findProps.personenstatus,
                sichtfreigabe: findProps.sichtfreigabe,
            },
            operator,
        );

        return this;
    }
}
