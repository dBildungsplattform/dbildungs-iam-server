import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { GruppeEntity } from '../persistence/gruppe.entity.js';
@Injectable()
export class GruppenRepository {
    public constructor(private readonly em: EntityManager) {}

    public async createGruppe(gruppe: GruppeEntity): Promise<Result<GruppeEntity, DomainError>> {
        try {
            await this.em.persistAndFlush(gruppe);
            return { ok: true, value: gruppe };
        } catch (error) {
            return { ok: false, error: new EntityCouldNotBeCreated('Gruppe') };
        }
    }
}
