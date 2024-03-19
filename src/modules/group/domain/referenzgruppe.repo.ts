import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ReferenzgruppeEntity } from '../persistence/referenzgruppe.entity.js';
import { DomainError, EntityCouldNotBeCreated } from '../../../shared/error/index.js';

@Injectable()
export class ReferenzgruppeRepository {
    public constructor(private readonly em: EntityManager) {}

    public async save(referenzgruppe: ReferenzgruppeEntity[]): Promise<Result<ReferenzgruppeEntity[], DomainError>> {
        try {
            await this.em.persistAndFlush(referenzgruppe);
            return { ok: true, value: referenzgruppe };
        } catch (error) {
            return { ok: false, error: new EntityCouldNotBeCreated('Referenzgruppe') };
        }
    }
}
