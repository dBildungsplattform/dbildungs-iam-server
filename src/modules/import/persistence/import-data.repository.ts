import { EntityManager, RequiredEntityData } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ImportDataItem } from '../domain/import-data-item.js';
import { ImportDataItemEntity } from './import-data-item.entity.js';
import { ImportDataItemScope } from './import-data-item.scope.js';

export function mapAggregateToData(importDataItem: ImportDataItem<boolean>): RequiredEntityData<ImportDataItemEntity> {
    return {
        importvorgangId: importDataItem.importvorgangId,
        familienname: importDataItem.familienname,
        vorname: importDataItem.vorname,
        klasse: importDataItem.klasse,
        personalnummer: importDataItem.personalnummer,
    };
}

export function mapEntityToAggregate(entity: ImportDataItemEntity): ImportDataItem<true> {
    return ImportDataItem.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.importvorgangId,
        entity.familienname,
        entity.vorname,
        entity.klasse,
        entity.personalnummer,
    );
}
@Injectable()
export class ImportDataRepository {
    public constructor(private readonly em: EntityManager) {}

    public async save(importDataItem: ImportDataItem<false>): Promise<ImportDataItem<true>> {
        const entity: ImportDataItemEntity = this.em.create(ImportDataItemEntity, mapAggregateToData(importDataItem));

        await this.em.persistAndFlush(entity);

        return mapEntityToAggregate(entity);
    }

    public async findByImportVorgangId(
        importvorgangId: string,
        offset?: number,
        limit?: number,
    ): Promise<Counted<ImportDataItem<true>>> {
        const scope: ImportDataItemScope = new ImportDataItemScope()
            .findByImportvorgangId(importvorgangId)
            .paged(offset, limit);

        const [entities, total]: Counted<ImportDataItemEntity> = await scope.executeQuery(this.em);
        const importDataItems: ImportDataItem<true>[] = entities.map((entity: ImportDataItemEntity) =>
            mapEntityToAggregate(entity),
        );
        return [importDataItems, total];
    }
}
