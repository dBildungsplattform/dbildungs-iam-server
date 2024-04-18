import { Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/error/index.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { Personenkontext } from './personenkontext.js';
import { NurLehrUndLernAnKlasse } from '../specification/nur-lehr-und-lern-an-klasse.js';
import { GleicheRolleAnKlasseWieSchule } from '../specification/gleiche-rolle-an-klasse-wie-schule.js';
import { PersonenkontextKlasseSpecification } from '../specification/personenkontext-klasse-specification.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';

@Injectable()
export class DBiamPersonenkontextService {
    public constructor(
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        private readonly organisationRepo: OrganisationRepo,
        private readonly rolleRepo: RolleRepo,
    ) {}

    public async checkSpecifications(personenkontext: Personenkontext<false>): Promise<Option<DomainError>> {
        //Check that only teachers and students are added to classes.
        const nurLehrUndLernAnKlasse: NurLehrUndLernAnKlasse = new NurLehrUndLernAnKlasse(
            this.organisationRepo,
            this.rolleRepo,
        );
        //Check that person has same role on parent-organisation, if organisation is a class.
        const gleicheRolleAnKlasseWieSchule: GleicheRolleAnKlasseWieSchule = new GleicheRolleAnKlasseWieSchule(
            this.organisationRepo,
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
