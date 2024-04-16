import { EntityName } from '@mikro-orm/core';
import { ScopeBase, ScopeOperator } from '../../../shared/persistence/index.js';
import { OrganisationEntity } from './organisation.entity.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';

export type OrganisationFindByProps = {
    kennung?: string;
    name?: string;
    typ?: OrganisationsTyp;
    searchString?: string;
};

export class OrganisationScope extends ScopeBase<OrganisationEntity> {
    protected override get entityName(): EntityName<OrganisationEntity> {
        return OrganisationEntity;
    }

    public findBy(findProps: Findable<OrganisationFindByProps>, operator: ScopeOperator = ScopeOperator.AND): this {
        const searchString: string | undefined =
            typeof findProps?.searchString === 'string' ? findProps.searchString : undefined;

        if (searchString && !findProps.kennung && !findProps.name && !findProps.typ) {
            return this.findBySubstring(['name', 'kennung'], searchString, ScopeOperator.OR);
        } else {
            const filterProps: Partial<OrganisationFindByProps> = {};
            if (typeof findProps.kennung === 'string') filterProps.kennung = findProps.kennung;
            if (typeof findProps.name === 'string') filterProps.name = findProps.name;
            if (findProps.typ !== undefined && typeof findProps.typ === 'string')
                filterProps.typ = findProps.typ as OrganisationsTyp;

            this.findByInternal(filterProps, operator);

            if (searchString) {
                this.findBySubstring(['name', 'kennung'], searchString, ScopeOperator.OR);
            }
        }

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
