import { Inject, Injectable } from '@nestjs/common';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { createMap, forMember, mapFrom, Mapper, MappingProfile } from '@automapper/core';
import { ServiceProviderZugriffDo } from '../domain/service-provider-zugriff.do.js';
import { ServiceProviderZugriffEntity } from './service-provider-zugriff.entity.js';

@Injectable()
export class ServiceProviderZugriffMapperProfile extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(mapper, ServiceProviderZugriffDo, ServiceProviderZugriffEntity);
            createMap(
                mapper,
                ServiceProviderZugriffEntity,
                ServiceProviderZugriffDo,
                forMember(
                    (dest: ServiceProviderZugriffDo<true>) => dest.serviceProvider,
                    mapFrom((src: ServiceProviderZugriffEntity) => src.serviceProvider),
                ),
            );
        };
    }
}
