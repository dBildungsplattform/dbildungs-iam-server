import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { ServiceProviderDo } from '../domain/service-provider.do.js';
import { ServiceProviderZugriffDo } from '../domain/service-provider-zugriff.do.js';
import { ServiceProviderEntity } from '../entity/service-provider.entity.js';

@Injectable()
export class ServiceProviderRepo {
    public constructor(private readonly em: EntityManager, @Inject(getMapperToken()) private readonly mapper: Mapper) {}

    public async findAll(
        serviceProviderZugriff: ServiceProviderZugriffDo<boolean>,
    ): Promise<ServiceProviderDo<true>[]> {
        const query: Record<string, unknown> = {};
        if (serviceProviderZugriff.serviceProvider) {
            query['id'] = { $ilike: serviceProviderZugriff.serviceProvider };
        }
        const result: ServiceProviderEntity[] = await this.em.find(ServiceProviderEntity, query);
        return result.map((serviceProvider: ServiceProviderEntity) =>
            this.mapper.map(serviceProvider, ServiceProviderEntity, ServiceProviderDo),
        );
    }
}
