import { EntityManager, RequiredEntityData } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ImportVorgangEntity } from './import-vorgang.entity.js';
import { ImportVorgang } from '../domain/import-vorgang.js';

export function mapAggregateToData(importVorgang: ImportVorgang<boolean>): RequiredEntityData<ImportVorgangEntity> {
    return {
        importByUsername: importVorgang.importByUsername,
        rollename: importVorgang.rollename,
        organisationsname: importVorgang.organisationsname,
        dataItemCount: importVorgang.dataItemCount,
        importByPersonId: importVorgang.importByPersonId,
        rolleId: importVorgang.rolleId,
        organisationId: importVorgang.organisationId,
    };
}

export function mapEntityToAggregate(entity: ImportVorgangEntity): ImportVorgang<true> {
    return ImportVorgang.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.importByUsername,
        entity.rollename,
        entity.organisationsname,
        entity.dataItemCount,
        entity.status,
        entity.importByPersonId,
        entity.rolleId,
        entity.organisationId,
    );
}

@Injectable()
export class ImportVorgangRepository {
    public constructor(private readonly em: EntityManager) {}

    public async save(importVorgang: ImportVorgang<boolean>): Promise<ImportVorgang<true>> {
        if (importVorgang.id) {
            return this.update(importVorgang);
        } else {
            return this.create(importVorgang);
        }
    }

    public async findById(id: string): Promise<Option<ImportVorgang<true>>> {
        const importVorgang: Option<ImportVorgangEntity> = await this.em.findOne(ImportVorgangEntity, { id });
        if (importVorgang) {
            return mapEntityToAggregate(importVorgang);
        }

        return null;
    }

    private async create(importVorgang: ImportVorgang<false>): Promise<ImportVorgang<true>> {
        const entity: ImportVorgangEntity = this.em.create(ImportVorgangEntity, mapAggregateToData(importVorgang));

        await this.em.persistAndFlush(entity);

        return mapEntityToAggregate(entity);
    }

    private async update(importVorgang: ImportVorgang<true>): Promise<ImportVorgang<true>> {
        const entity: ImportVorgangEntity = await this.em.findOneOrFail(ImportVorgangEntity, importVorgang.id);
        this.em.assign(entity, mapAggregateToData(importVorgang));
        await this.em.persistAndFlush(entity);
        return mapEntityToAggregate(entity);
    }
}
