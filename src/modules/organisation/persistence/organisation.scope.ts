import { EntityName } from '@mikro-orm/core';
import { ScopeBase, ScopeOperator } from '../../../shared/persistence/index.js';
import { OrganisationEntity } from './organisation.entity.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';

type FindProps = {
    kennung: string;
    name: string;
    typ: OrganisationsTyp;
};

export class OrganisationScope extends ScopeBase<OrganisationEntity> {
    protected override get entityName(): EntityName<OrganisationEntity> {
        return OrganisationEntity;
    }

    public findBy(findProps: Findable<FindProps>, operator: ScopeOperator = ScopeOperator.AND): this {
        this.findByInternal(
            {
                kennung: findProps.kennung,
                name: findProps.name,
                typ: findProps.typ,
            },
            operator,
        );

        return this;
    }

    public findAdministrierteVon(parentOrganisationId: string): this {
        this.findByInternal(
            {
                administriertVon: parentOrganisationId,
            },
            ScopeOperator.AND,
        );

        return this;
    }

    public findZugehoerigeZu(parentOrganisationId: string): this {
        this.findByInternal(
            {
                zugehoerigZu: parentOrganisationId,
            },
            ScopeOperator.AND,
        );

        return this;
    }
}
