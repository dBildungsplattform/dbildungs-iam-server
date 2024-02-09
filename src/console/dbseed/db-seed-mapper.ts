import { Inject, Injectable } from '@nestjs/common';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { createMap, Mapper, MappingProfile } from '@automapper/core';
import { PersonRollenZuweisungFile } from './file/person-rollen-zuweisung-file.js';
import { PersonRollenZuweisungEntity } from '../../modules/service-provider/entity/person-rollen-zuweisung.entity.js';
import { ServiceProviderZugriffFile } from './file/service-provider-zugriff-file.js';
import { ServiceProviderZugriffEntity } from '../../modules/service-provider/entity/service-provider-zugriff.entity.js';
import { OrganisationFile } from './file/organisation-file.js';
import { OrganisationEntity } from '../../modules/organisation/persistence/organisation.entity.js';
import { DataProviderFile } from './file/data-provider-file.js';
import { DataProviderEntity } from '../../persistence/data-provider.entity.js';
import { PersonFile } from './file/person-file.js';
import { PersonEntity } from '../../modules/person/persistence/person.entity.js';
import { ServiceProviderFile } from './file/service-provider-file.js';
import { ServiceProviderEntity } from '../../modules/service-provider/entity/service-provider.entity.js';

@Injectable()
export class DbSeedMapper extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(mapper, DataProviderFile, DataProviderEntity);
            createMap(mapper, OrganisationFile, OrganisationEntity);
            createMap(mapper, PersonFile, PersonEntity);
            createMap(mapper, ServiceProviderFile, ServiceProviderEntity);
            createMap(mapper, PersonRollenZuweisungFile, PersonRollenZuweisungEntity);
            createMap(mapper, ServiceProviderZugriffFile, ServiceProviderZugriffEntity);
        };
    }
}
