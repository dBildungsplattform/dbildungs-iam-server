import { Injectable } from '@nestjs/common';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { Personenkontext } from './personenkontext.js';
import { PersonenkontextKlasseSpecification } from '../specification/personenkontext-klasse-specification.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { PersonenkontextSpecificationError } from '../specification/error/personenkontext-specification.error.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { CheckRollenartSpecification } from '../specification/nur-gleiche-rolle.js';
import { CheckBefristungSpecification } from '../specification/befristung-required-bei-rolle-befristungspflicht.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RollenMerkmal } from '../../rolle/domain/rolle.enums.js';

@Injectable()
export class DBiamPersonenkontextService {
    public constructor(
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly rolleRepo: RolleRepo,
        private readonly personenkontextKlasseSpecification: PersonenkontextKlasseSpecification,
    ) {}

    public async checkSpecifications(
        personenkontext: Personenkontext<false>,
    ): Promise<Option<PersonenkontextSpecificationError>> {
        return this.personenkontextKlasseSpecification.returnsError(personenkontext);
    }

    public async isPersonalnummerRequiredForAnyPersonenkontextForPerson(personId: string): Promise<boolean> {
        const personenkontexte: Personenkontext<true>[] = await this.dBiamPersonenkontextRepo.findByPerson(personId);
        const uniqueRolleIds: Set<string> = new Set(personenkontexte.map((pk: Personenkontext<true>) => pk.rolleId));
        const foundRollen: Map<string, Rolle<true>> = await this.rolleRepo.findByIds(Array.from(uniqueRolleIds));

        return Array.from(foundRollen.values()).some((rolle: Rolle<true>) =>
            rolle.merkmale.includes(RollenMerkmal.KOPERS_PFLICHT),
        );
    }
}
