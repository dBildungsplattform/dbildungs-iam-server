import { Mapper, MappingProfile, createMap } from '@automapper/core';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { GetServiceProviderInfoDo } from '../domain/get-service-provider-info.do.js';
import { ServiceProviderInfoResponse } from './service-provider-info.response.js';

@Injectable()
export class ProviderApiMapperProfile extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(mapper, GetServiceProviderInfoDo, ServiceProviderInfoResponse);
        };
    }
}
