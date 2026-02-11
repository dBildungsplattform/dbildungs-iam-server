import { EntityName } from '@mikro-orm/core';
import { ScopeBase } from '../../../shared/persistence';
import { RolleEntity } from '../entity/rolle.entity';
import { EntityManager, SelectQueryBuilder } from '@mikro-orm/postgresql';
import { OrganisationID } from '../../../shared/types/index.js';
import { RollenArt } from '../domain/rolle.enums.js';

export class RolleScope extends ScopeBase<RolleEntity> {
    private includeTechnische: boolean = false;

    public override get entityName(): EntityName<RolleEntity> {
        return RolleEntity;
    }

    public override async executeQuery(em: EntityManager): Promise<Counted<RolleEntity>> {
        const selectQuery: SelectQueryBuilder<RolleEntity> = this.getQueryBuilder(em);
        if (!this.includeTechnische) {
            selectQuery.andWhere({ istTechnisch: false });
        }
        const [entities, count]: [RolleEntity[], number] = await selectQuery.getResultAndCount();
        await em.populate(entities, ['merkmale', 'systemrechte', 'serviceProvider.serviceProvider'], {
            exclude: ['serviceProvider.serviceProvider.logo'],
        });

        return [entities, count];
    }

    public findByRollenArten(rollenArten?: RollenArt[]): this {
        if (rollenArten && rollenArten.length > 0) {
            this.findByQuery({
                rollenart: { $in: rollenArten },
            });
        }

        return this;
    }

    public findByOrganisationen(organisationenIds?: OrganisationID[]): this {
        if (organisationenIds && organisationenIds.length > 0) {
            this.findByQuery({
                administeredBySchulstrukturknoten: { $in: organisationenIds },
            });
        }

        return this;
    }

    public setIncludeTechnische(includeTechnische: boolean): this {
        this.includeTechnische = includeTechnische;
        return this;
    }
}
