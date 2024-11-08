import { RolleNameUniqueOnSsk } from '../specification/rolle-name-unique-on-ssk.js';
import { RolleNameNotUniqueOnSskError } from '../specification/error/rolle-name-not-unique-on-ssk.error.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { Rolle } from './rolle.js';
import { CreateRolleBodyParams } from '../api/create-rolle.body.params.js';
import { RolleFactory } from './rolle.factory.js';

export class RolleWorkflow {
    private constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly rolleFactory: RolleFactory,
    ) {}

    public static createNew(rolleRepo: RolleRepo, rolleFactory: RolleFactory): RolleWorkflow {
        return new RolleWorkflow(rolleRepo, rolleFactory);
    }

    /**
     * Creates a new Rolle via @RolleFactory and validates whether created rolle satisfies @RolleNameUniqueOnSsk specification.
     * @param params
     */
    public async createNewRolleAndValidateNameUniquenessOnSSK(
        params: CreateRolleBodyParams,
    ): Promise<Rolle<false> | DomainError> {
        const rolle: DomainError | Rolle<false> = this.rolleFactory.createNew(
            params.name,
            params.administeredBySchulstrukturknoten,
            params.rollenart,
            params.merkmale,
            params.systemrechte,
            [],
            [],
            false,
        );

        if (rolle instanceof DomainError) {
            return rolle;
        }

        const rolleNameUniqueOnSSK: RolleNameUniqueOnSsk = new RolleNameUniqueOnSsk(this.rolleRepo, params.name);
        if (!(await rolleNameUniqueOnSSK.isSatisfiedBy(rolle))) {
            return new RolleNameNotUniqueOnSskError();
        }

        return rolle;
    }
}
