import { Module } from '@nestjs/common';
import { CheckBefristungSpecification } from './befristung-required-bei-rolle-befristungspflicht.js';
import { GleicheRolleAnKlasseWieSchule } from './gleiche-rolle-an-klasse-wie-schule.js';
import { NurLehrUndLernAnKlasse } from './nur-lehr-und-lern-an-klasse.js';
import { CheckRollenartLernSpecification } from './nur-rolle-lern.js';
import { OrganisationMatchesRollenart } from './organisation-matches-rollenart.js';
import { PersonenkontextKlasseSpecification } from './personenkontext-klasse-specification.js';
import { RolleModule } from '../../rolle/rolle.module.js';
import { OrganisationModule } from '../../organisation/organisation.module.js';
import { PersonenkontextPersistenceModule } from '../persistence/PersonenkontextPersistenceModule.js';
import { PersonenkontextSpecification } from './personenkontext-specification.js';

@Module({
    imports: [RolleModule, OrganisationModule, PersonenkontextPersistenceModule],
    providers: [
        CheckBefristungSpecification,
        GleicheRolleAnKlasseWieSchule,
        NurLehrUndLernAnKlasse,
        CheckRollenartLernSpecification,
        OrganisationMatchesRollenart,
        PersonenkontextKlasseSpecification,
        PersonenkontextSpecification,
    ],
    exports: [PersonenkontextKlasseSpecification],
})
export class PersonenkontextSpecificationsModule {}
