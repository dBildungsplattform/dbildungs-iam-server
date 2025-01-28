import { EntityManager, Loaded, RequiredEntityData } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ImportDataItemEntity } from './import-data-item.entity.js';
import { ImportDataItemScope } from './import-data-item.scope.js';
import { ImportDataItem } from '../domain/import-data-item.js';
import { ImportDataItemStatus } from '../domain/importDataItem.enum.js';

export function mapAggregateToData(importDataItem: ImportDataItem<boolean>): RequiredEntityData<ImportDataItemEntity> {
    return {
        importvorgangId: importDataItem.importvorgangId,
        nachname: importDataItem.nachname,
        vorname: importDataItem.vorname,
        klasse: importDataItem.klasse,
        personalnummer: importDataItem.personalnummer,
        validationErrors: importDataItem.validationErrors,
        username: importDataItem.username,
        password: importDataItem.password,
        status: importDataItem.status,
    };
}

export function mapEntityToAggregate(entity: ImportDataItemEntity): ImportDataItem<true> {
    return ImportDataItem.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.importvorgangId.id,
        entity.nachname,
        entity.vorname,
        entity.status,
        entity.klasse,
        entity.personalnummer,
        entity.validationErrors,
        entity.username,
        entity.password,
    );
}
@Injectable()
export class ImportDataRepository {
    public constructor(private readonly em: EntityManager) {}

    public async save(importDataItem: ImportDataItem<boolean>): Promise<ImportDataItem<true>> {
        if (importDataItem.id) {
            return this.update(importDataItem);
        } else {
            return this.create(importDataItem);
        }
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

    public async deleteByImportVorgangId(importvorgangId: string): Promise<void> {
        //Optimierung: check if there are any items to delete when ImportVorgang will be saved in his own table
        await this.em.nativeDelete(ImportDataItemEntity, { importvorgangId: importvorgangId });
    }

    public async createAll(importDataItems: ImportDataItem<false>[]): Promise<string[]> {
        const entities: ImportDataItemEntity[] = importDataItems.map((importDataItem: ImportDataItem<false>) => {
            return this.em.create(ImportDataItemEntity, mapAggregateToData(importDataItem));
        });

        await this.em.persistAndFlush(entities);

        return entities.map((entity: ImportDataItemEntity) => entity.id);
    }

    private async create(importDataItem: ImportDataItem<false>): Promise<ImportDataItem<true>> {
        const entity: ImportDataItemEntity = this.em.create(ImportDataItemEntity, mapAggregateToData(importDataItem));

        await this.em.persistAndFlush(entity);

        return mapEntityToAggregate(entity);
    }

    private async update(importDataItem: ImportDataItem<true>): Promise<ImportDataItem<true>> {
        const entity: Loaded<ImportDataItemEntity> = await this.em.findOneOrFail(
            ImportDataItemEntity,
            importDataItem.id,
        );
        this.em.assign(entity, mapAggregateToData(importDataItem));
        await this.em.persistAndFlush(entity);
        return mapEntityToAggregate(entity);
    }

    public async countProcessedItems(importvorgangId: string): Promise<number> {
        return this.em.count(ImportDataItemEntity, {
            importvorgangId,
            status: { $in: [ImportDataItemStatus.SUCCESS, ImportDataItemStatus.FAILED] },
        });
    }
}
