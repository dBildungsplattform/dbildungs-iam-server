import { EntityManager, Loaded, RequiredEntityData } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ImportVorgangEntity } from './import-vorgang.entity.js';
import { ImportVorgang } from '../domain/import-vorgang.js';
import { ImportStatus } from '../domain/import.enums.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { RollenSystemRecht } from '../../rolle/domain/systemrecht.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';

export function mapAggregateToData(importVorgang: ImportVorgang<boolean>): RequiredEntityData<ImportVorgangEntity> {
    return {
        importByUsername: importVorgang.importByUsername,
        rollename: importVorgang.rollename,
        organisationsname: importVorgang.organisationsname,
        dataItemCount: importVorgang.dataItemCount,
        status: importVorgang.status,
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
        entity.importByPersonId?.unwrap().id,
        entity.rolleId?.unwrap().id,
        entity.organisationId?.unwrap().id,
    );
}

export type ImportQueryOptions = {
    readonly status?: ImportStatus;
    readonly personId?: string;
    readonly rolleIds?: string[];
    readonly organisationIds?: string[];
    readonly offset?: number;
    readonly limit?: number;
};

@Injectable()
export class ImportVorgangRepository {
    public constructor(
        private readonly em: EntityManager,
        private readonly logger: ClassLogger,
    ) {}

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

    public async findAuthorized(
        permissions: PersonPermissions,
        queryOptions: ImportQueryOptions,
    ): Promise<[ImportVorgang<true>[], total: number]> {
        const hasPermissionAtOrga: boolean = await permissions.hasSystemrechteAtRootOrganisation([
            RollenSystemRecht.IMPORT_DURCHFUEHREN,
        ]);

        if (!hasPermissionAtOrga) {
            //Log Unauthorized to view import history
            return [[], 0];
        }

        const [importvorgänge, total]: [Option<ImportVorgangEntity[]>, number] = await this.em.findAndCount(
            ImportVorgangEntity,
            {
                ...(queryOptions.personId ? { importByPersonId: queryOptions.personId } : {}),
                ...(queryOptions.status ? { status: queryOptions.status } : {}),
                ...(queryOptions.rolleIds ? { rolleId: { $in: queryOptions.rolleIds } } : {}),
                ...(queryOptions.organisationIds ? { organisationId: { $in: queryOptions.organisationIds } } : {}),
            },
            {
                limit: queryOptions.limit,
                offset: queryOptions.offset,
            },
        );

        if (total === 0) {
            return [[], 0];
        }

        return [importvorgänge.map((importvorgang: ImportVorgangEntity) => mapEntityToAggregate(importvorgang)), total];
    }

    private async create(importVorgang: ImportVorgang<false>): Promise<ImportVorgang<true>> {
        const entity: ImportVorgangEntity = this.em.create(ImportVorgangEntity, mapAggregateToData(importVorgang));
        try {
            await this.em.persistAndFlush(entity);
        } catch (error) {
            this.logger.error('Error creating ImportVorgang entity', error);
            throw error;
        }
        return mapEntityToAggregate(entity);
    }

    private async update(importVorgang: ImportVorgang<true>): Promise<ImportVorgang<true>> {
        const entity: Loaded<ImportVorgangEntity> = await this.em.findOneOrFail(ImportVorgangEntity, importVorgang.id);
        this.em.assign(entity, mapAggregateToData(importVorgang));
        await this.em.persistAndFlush(entity);
        return mapEntityToAggregate(entity);
    }
}
