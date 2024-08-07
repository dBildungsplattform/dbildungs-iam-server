import { Injectable } from '@nestjs/common';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { Personenkontext } from './personenkontext.js';
import { NurLehrUndLernAnKlasse } from '../specification/nur-lehr-und-lern-an-klasse.js';
import { GleicheRolleAnKlasseWieSchule } from '../specification/gleiche-rolle-an-klasse-wie-schule.js';
import { PersonenkontextKlasseSpecification } from '../specification/personenkontext-klasse-specification.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { PersonenkontextSpecificationError } from '../specification/error/personenkontext-specification.error.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';

@Injectable()
export class DBiamPersonenkontextService {
    public constructor(
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        private readonly organisationRepository: OrganisationRepository,
        private readonly rolleRepo: RolleRepo,
    ) {}

    public async checkSpecifications(
        personenkontext: Personenkontext<false>,
    ): Promise<Option<PersonenkontextSpecificationError>> {
        //Check that only teachers and students are added to classes.
        const nurLehrUndLernAnKlasse: NurLehrUndLernAnKlasse = new NurLehrUndLernAnKlasse(
            this.organisationRepository,
            this.rolleRepo,
        );
        //Check that person has same role on parent-organisation, if organisation is a class.
        const gleicheRolleAnKlasseWieSchule: GleicheRolleAnKlasseWieSchule = new GleicheRolleAnKlasseWieSchule(
            this.organisationRepository,
            this.personenkontextRepo,
            this.rolleRepo,
        );
        const pkKlasseSpecification: PersonenkontextKlasseSpecification = new PersonenkontextKlasseSpecification(
            nurLehrUndLernAnKlasse,
            gleicheRolleAnKlasseWieSchule,
        );

        return pkKlasseSpecification.returnsError(personenkontext);
    }
}
