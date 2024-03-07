import { EntityData, EntityManager, EntityName, Loaded, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { RollenMerkmal } from '../domain/rolle.enums.js';
import { Rolle } from '../domain/rolle.js';
import { RolleMerkmalEntity } from '../entity/rolle-merkmal.entity.js';
import { RolleEntity } from '../entity/rolle.entity.js';
import { RolleFactory } from '../domain/rolle.factory.js';
import { ServiceProviderEntity } from '../../service-provider/repo/service-provider.entity.js';
import { RolleServiceProviderEntity } from '../entity/rolle-service-provider.entity.js';

/**
 * @deprecated Not for use outside of rolle-repo, export will be removed at a later date
 */
export function mapAggregateToData(rolle: Rolle<boolean>): RequiredEntityData<RolleEntity> {
    const merkmale: EntityData<RolleMerkmalEntity>[] = rolle.merkmale.map((merkmal: RollenMerkmal) => ({
        rolle: rolle.id,
        merkmal,
    }));

    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        id: rolle.id,
        name: rolle.name,
        administeredBySchulstrukturknoten: rolle.administeredBySchulstrukturknoten,
        rollenart: rolle.rollenart,
        merkmale,
    };
}

function mapEntityToAggregate(entity: RolleEntity, rolleFactory: RolleFactory): Rolle<boolean> {
    const merkmale: RollenMerkmal[] = entity.merkmale.map((merkmalEntity: RolleMerkmalEntity) => merkmalEntity.merkmal);
    const serviceProviderIds: string[] = entity.serviceProvider.map(
        (serviceProvider: ServiceProviderEntity) => serviceProvider.id,
    );

    return rolleFactory.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.name,
        entity.administeredBySchulstrukturknoten,
        entity.rollenart,
        merkmale,
        serviceProviderIds,
    );
}
@Injectable()
export class RolleRepo {
    public constructor(
        private readonly rolleFactory: RolleFactory,
        private readonly em: EntityManager,
    ) {}

    public get entityName(): EntityName<RolleEntity> {
        return RolleEntity;
    }

    public async findById(id: string): Promise<Option<Rolle<true>>> {
        const rolle: Option<RolleEntity> = await this.em.findOne(
            this.entityName,
            { id },
            { populate: ['merkmale', 'serviceProvider'] as const },
        );

        return rolle && mapEntityToAggregate(rolle, this.rolleFactory);
    }

    public async find(): Promise<Rolle<true>[]> {
        const rollen: RolleEntity[] = await this.em.findAll(RolleEntity, {
            populate: ['merkmale', 'serviceProvider'] as const,
        });

        return rollen.map((rolle: RolleEntity) => mapEntityToAggregate(rolle, this.rolleFactory));
    }

    public async save(rolle: Rolle<boolean>): Promise<Rolle<true>> {
        let persistedRolleEntity: RolleEntity;
        if (rolle.id) {
            persistedRolleEntity = await this.update(rolle);
        } else {
            persistedRolleEntity = await this.create(rolle);
        }
        await this.applyServiceProviderChanges(persistedRolleEntity, rolle);

        const refreshedRolleEntity: RolleEntity = await this.em.findOneOrFail(RolleEntity, persistedRolleEntity.id);
        return mapEntityToAggregate(refreshedRolleEntity, this.rolleFactory);
    }

    private async create(rolle: Rolle<false>): Promise<RolleEntity> {
        const rolleEntity: RolleEntity = this.em.create(RolleEntity, mapAggregateToData(rolle));

        await this.em.persistAndFlush(rolleEntity);

        return rolleEntity;
    }

    private async update(rolle: Rolle<true>): Promise<RolleEntity> {
        const rolleEntity: Loaded<RolleEntity> = await this.em.findOneOrFail(RolleEntity, rolle.id);
        rolleEntity.assign(mapAggregateToData(rolle), { merge: true });

        await this.em.persistAndFlush(rolleEntity);

        return rolleEntity;
    }

    private async applyServiceProviderChanges(rolleEntity: RolleEntity, rolle: Rolle<boolean>): Promise<void> {
        const currentServiceProviderIds: string[] = rolleEntity.serviceProvider.map(
            (sp: ServiceProviderEntity) => sp.id,
        );
        const newServiceProviderIds: string[] = rolle.serviceProviderIds;

        // Determine service providers to attach
        const serviceProviderIdsToAttach: string[] = newServiceProviderIds.filter(
            (id: string) => !currentServiceProviderIds.includes(id),
        );
        // Attach
        for (const id of serviceProviderIdsToAttach) {
            await this.attachServiceProviderToRolle(rolleEntity, id);
        }
        // Determine service providers to detach
        const serviceProviderIdsToDetach: string[] = currentServiceProviderIds.filter(
            (id: string) => !newServiceProviderIds.includes(id),
        );
        // Detach
        for (const id of serviceProviderIdsToDetach) {
            await this.detachServiceProviderFromRolle(rolleEntity, id);
        }

        await this.em.persistAndFlush(rolleEntity);
    }

    private async attachServiceProviderToRolle(rolleEntity: RolleEntity, serviceProviderId: string): Promise<void> {
        const serviceProvider: ServiceProviderEntity = await this.em.findOneOrFail(
            ServiceProviderEntity,
            serviceProviderId,
        );
        const rolleServiceProvider: RolleServiceProviderEntity = this.em.create(RolleServiceProviderEntity, {
            rolle: rolleEntity,
            serviceProvider: serviceProvider,
        });

        await this.em.persistAndFlush(rolleServiceProvider);
    }

    private async detachServiceProviderFromRolle(rolleEntity: RolleEntity, serviceProviderId: string): Promise<void> {
        const rolleServiceProvider: RolleServiceProviderEntity = await this.em.findOneOrFail(
            RolleServiceProviderEntity,
            {
                rolle: rolleEntity,
                serviceProvider: serviceProviderId,
            },
        );

        if (rolleServiceProvider) {
            await this.em.removeAndFlush(rolleServiceProvider);
        }
    }
}
