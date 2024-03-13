import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { GruppeEntity } from '../persistence/gruppe.entity.js';
import { Gruppe } from './gruppe.js';
import { GruppeMapper } from './gruppe.mapper.js';

@Injectable()
export class GruppenRepository {
    public constructor(
        private readonly em: EntityManager,
        private readonly mapper: GruppeMapper,
    ) {}

    public async save(gruppe: Gruppe<false>): Promise<Result<Gruppe<true>, DomainError>> {
        try {
            const entity: GruppeEntity = this.mapper.mapGruppeToGruppeEntity(gruppe);
            await this.em.persistAndFlush(entity);
            return { ok: true, value: this.mapper.mapGruppeEntityToGruppe(entity) };
        } catch (error) {
            return { ok: false, error: new EntityCouldNotBeCreated('Gruppe') };
        }
    }
}
