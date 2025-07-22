import { Mapper, MappingProfile, createMap, forMember, mapFrom } from '@automapper/core';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { ref } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationEntity } from './organisation.entity.js';

@Injectable()
export class OrganisationPersistenceMapperProfile extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(
                mapper,
                OrganisationDo,
                OrganisationEntity,
                forMember(
                    (dest: OrganisationEntity) => dest.administriertVon,
                    mapFrom(
                        (src: OrganisationDo<true>) =>
                            src.administriertVon && ref(OrganisationEntity, src.administriertVon),
                    ),
                ),
                forMember(
                    (dest: OrganisationEntity) => dest.zugehoerigZu,
                    mapFrom(
                        (src: OrganisationDo<true>) => src.zugehoerigZu && ref(OrganisationEntity, src.zugehoerigZu),
                    ),
                ),
            );
            createMap(
                mapper,
                OrganisationEntity,
                OrganisationDo,
                forMember(
                    (dest: OrganisationDo<true>) => dest.id,
                    mapFrom((src: OrganisationEntity) => src.id),
                ),
                forMember(
                    (dest: OrganisationDo<true>) => dest.administriertVon,
                    mapFrom((src: OrganisationEntity) => src.administriertVon?.id),
                ),
                forMember(
                    (dest: OrganisationDo<true>) => dest.zugehoerigZu,
                    mapFrom((src: OrganisationEntity) => src.zugehoerigZu?.id),
                ),
            );
        };
    }
}
