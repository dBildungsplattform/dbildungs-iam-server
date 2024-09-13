import { Organisation } from './organisation.js';
import { OrganisationEntity } from '../persistence/organisation.entity.js';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

export function mapEntityToAggregate(entity: OrganisationEntity, orgRecService: OrgRecService): Organisation<true> {
    return Organisation.construct(
        orgRecService,
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.administriertVon,
        entity.zugehoerigZu,
        entity.kennung,
        entity.name,
        entity.namensergaenzung,
        entity.kuerzel,
        entity.typ,
        entity.traegerschaft,
        entity.emailDomain,
    );
}

@Injectable()
export class OrgRecService {
    public constructor(private readonly em: EntityManager) {}

    public async findById(id: string): Promise<Option<Organisation<true>>> {
        const organisation: Option<OrganisationEntity> = await this.em.findOne(OrganisationEntity, { id });
        if (organisation) {
            return mapEntityToAggregate(organisation, this);
        }
        return null;
    }
}
