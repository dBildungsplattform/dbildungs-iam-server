import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { EntityCouldNotBeCreated, DomainError } from '../../../shared/error/index.js';
import { GruppeEntity } from '../persistence/gruppe.entity.js';
import { Gruppe } from './gruppe.js';
import { GruppeMapper } from './gruppe.mapper.js';
import { ReferenzgruppeRepository } from './referenzgruppe.repo.js';

@Injectable()
export class GruppenRepository {
    public constructor(
        private readonly em: EntityManager,
        private readonly mapper: GruppeMapper,
        private readonly referenzgruppeRepository: ReferenzgruppeRepository,
    ) {}

    public async save(gruppe: Gruppe<false>): Promise<Result<Gruppe<true>, DomainError>> {
        try {
            if (gruppe.referenzgruppenIds && gruppe.referenzgruppenRollen) {
                await this.referenzgruppeRepository.save(this.mapper.getReferenzgruppenFromGruppeAggregate(gruppe));
            }
            const entity: GruppeEntity = this.mapper.mapGruppeToGruppeEntity(gruppe);
            await this.em.persistAndFlush(entity);
            return { ok: true, value: this.mapper.mapGruppeEntityToGruppe(entity) };
        } catch (error) {
            return { ok: false, error: new EntityCouldNotBeCreated('Gruppe') };
        }
    }
}
