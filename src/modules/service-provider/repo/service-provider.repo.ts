import { EntityManager, Loaded, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderEntity } from './service-provider.entity.js';
import { CreateGroupAndRoleEvent } from '../../../shared/events/kc-group-and-role-event.js';
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

        this.eventService.publish(new CreateGroupAndRoleEvent(serviceProviderEntity.name, serviceProviderEntity.name));

        return mapEntityToAggregate(serviceProviderEntity);
    }

    @EventHandler(CreateGroupAndRoleEvent)
    public async handleCreateGroupAndRoleEvent(event: CreateGroupAndRoleEvent): Promise<void> {
        console.log(`Received CreateGroupAndRoleEvent, groupName: ${event.groupName}`);

        const group: Result<string, DomainError> = await this.keycloakUserService.createGroup(event.groupName);
        if (!group.ok) {
            console.error(`Could not create group, error: ${group.error.message}`);
            return;
        }
        const groupId: string = group.value;

        const role: Result<string, DomainError> = await this.keycloakUserService.createRole(event.roleName);
        if (!role.ok) {
            console.error(`Could not create role, error: ${role.error.message}`);
            return;
        }
        const roleName: string = role.value;

        const addRoleToGroup: Result<boolean, DomainError> = await this.keycloakUserService.addRoleToGroup(
            groupId,
            roleName,
        );
        if (!addRoleToGroup.ok) {
            console.error(`Could not add role to group, message: ${addRoleToGroup.error.message}`);
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
