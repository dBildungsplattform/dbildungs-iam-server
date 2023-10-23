import { Inject, Injectable } from '@nestjs/common';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { createMap, forMember, mapFrom, Mapper, MappingProfile } from '@automapper/core';
import { ServiceProviderDo } from '../domain/service-provider.do.js';
import { ServiceProviderEntity } from '../entity/service-provider.entity.js';
import { GetServiceProviderInfoDo } from '../domain/get-service-provider-info.do.js';

@Injectable()
export class ServiceProviderMapperProfile extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(mapper, ServiceProviderDo, ServiceProviderEntity);
            createMap(
                mapper,
                ServiceProviderEntity,
                ServiceProviderDo,
                forMember(
                    (dest: ServiceProviderDo<true>) => dest.id,
                    mapFrom((src: ServiceProviderEntity) => src.id),
                ),
            );
            //
            createMap(
                mapper,
                ServiceProviderDo,
                GetServiceProviderInfoDo,
                forMember(
                    (dest: GetServiceProviderInfoDo) => dest.url,
                    mapFrom((src: ServiceProviderDo<true>) => src.url),
                ),
            );
        };
    }
}
