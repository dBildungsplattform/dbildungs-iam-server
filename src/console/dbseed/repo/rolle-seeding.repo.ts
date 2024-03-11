import { Injectable } from '@nestjs/common';
import { mapAggregateToData, mapEntityToAggregate, RolleRepo } from '../../../modules/rolle/repo/rolle.repo.js';
import { Rolle } from '../../../modules/rolle/domain/rolle.js';
import { RolleEntity } from '../../../modules/rolle/entity/rolle.entity.js';

@Injectable()
export class RolleSeedingRepo extends RolleRepo {
    public override async save(rolle: Rolle<boolean>): Promise<Rolle<true>> {
        const rolleEntity: RolleEntity = this.em.create(RolleEntity, mapAggregateToData(rolle));
        this.em.persist(rolleEntity);
        return Promise.resolve(mapEntityToAggregate(rolleEntity));
    }
}
