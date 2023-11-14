import { EntityName, Reference } from '@mikro-orm/core';
import { ScopeBase, ScopeOperator } from '../../../shared/persistence/index.js';
import { OrganisationEntity } from './organisation.entity.js';
import { OrganisationsTyp } from '../domain/organisation.enum.js';

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

    public findVerwalteteVon(parentOrganisationId: string): this {
        this.findByInternal(
            {
                verwaltetVon: Reference.createFromPK(OrganisationEntity, parentOrganisationId),
            },
            ScopeOperator.AND,
        );

        return this;
    }

    public findZugehoerigeZu(parentOrganisationId: string): this {
        this.findByInternal(
            {
                zugehoerigZu: Reference.createFromPK(OrganisationEntity, parentOrganisationId),
            },
            ScopeOperator.AND,
        );

        return this;
    }
}
