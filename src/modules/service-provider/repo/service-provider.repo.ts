import { EntityManager, Loaded, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderEntity } from './service-provider.entity.js';
import { CreateGroupEvent } from '../../../shared/events/kc-group-event.js';
import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { KeycloakUserService } from '../../keycloak-administration/index.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { EventService } from '../../../core/eventbus/index.js';

/* eslint-disable no-console */
/**
 * @deprecated Not for use outside of service-provider-repo, export will be removed at a later date
 */
export function mapAggregateToData(
    serviceProvider: ServiceProvider<boolean>,
): RequiredEntityData<ServiceProviderEntity> {
    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        id: serviceProvider.id,
        name: serviceProvider.name,
        target: serviceProvider.target,
        url: serviceProvider.url,
        kategorie: serviceProvider.kategorie,
        providedOnSchulstrukturknoten: serviceProvider.providedOnSchulstrukturknoten,
        logo: serviceProvider.logo,
        logoMimeType: serviceProvider.logoMimeType,
    };
}

function mapEntityToAggregate(entity: ServiceProviderEntity): ServiceProvider<boolean> {
    return ServiceProvider.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.name,
        entity.target,
        entity.url,
        entity.kategorie,
        entity.providedOnSchulstrukturknoten,
        entity.logo,
        entity.logoMimeType,
    );
}

type ServiceProviderFindOptions = {
    withLogo?: boolean;
};

@Injectable()
export class ServiceProviderRepo {
    public constructor(
        private readonly em: EntityManager,
        private readonly keycloakUserService: KeycloakUserService,
        private readonly eventService: EventService,
    ) {}

    public async findById(id: string, options?: ServiceProviderFindOptions): Promise<Option<ServiceProvider<true>>> {
        const exclude: readonly ['logo'] | undefined = options?.withLogo ? undefined : ['logo'];

        const serviceProvider: Option<ServiceProviderEntity> = (await this.em.findOne(
            ServiceProviderEntity,
            { id },
            { exclude },
        )) as Option<ServiceProviderEntity>;

        return serviceProvider && mapEntityToAggregate(serviceProvider);
    }

    public async find(options?: ServiceProviderFindOptions): Promise<ServiceProvider<true>[]> {
        const exclude: readonly ['logo'] | undefined = options?.withLogo ? undefined : ['logo'];

        const serviceProviders: ServiceProviderEntity[] = (await this.em.findAll(ServiceProviderEntity, {
            exclude,
        })) as ServiceProviderEntity[];

        return serviceProviders.map(mapEntityToAggregate);
    }

    public async save(serviceProvider: ServiceProvider<boolean>): Promise<ServiceProvider<true>> {
        if (serviceProvider.id) {
            return this.update(serviceProvider);
        } else {
            return this.create(serviceProvider);
        }
    }

    // TODO probably add the api here

    private async create(serviceProvider: ServiceProvider<false>): Promise<ServiceProvider<true>> {
        const serviceProviderEntity: ServiceProviderEntity = this.em.create(
            ServiceProviderEntity,
            mapAggregateToData(serviceProvider),
        );

        await this.em.persistAndFlush(serviceProviderEntity);

        this.eventService.publish(new CreateGroupEvent(serviceProviderEntity.name));

        return mapEntityToAggregate(serviceProviderEntity);
    }

    @EventHandler(CreateGroupEvent)
    public async handleCreateGroupEvent(event: CreateGroupEvent): Promise<void> {
        console.log(`Received CreateGroupEvent, groupName: ${event.groupName}`);

        const result: Result<string, DomainError> = await this.keycloakUserService.createGroup(event.groupName);
        if (!result.ok) {
            console.error(`Could not create group, message: ${result.error.message}`);
        }
    }

    private async update(serviceProvider: ServiceProvider<true>): Promise<ServiceProvider<true>> {
        const serviceProviderEntity: Loaded<ServiceProviderEntity> = await this.em.findOneOrFail(
            ServiceProviderEntity,
            serviceProvider.id,
        );
        serviceProviderEntity.assign(mapAggregateToData(serviceProvider));

        await this.em.persistAndFlush(serviceProviderEntity);

        return mapEntityToAggregate(serviceProviderEntity);
    }
}
