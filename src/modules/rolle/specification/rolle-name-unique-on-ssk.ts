import { CompositeSpecification } from '../../specification/specifications.js';

import { Rolle } from '../domain/rolle.js';
import { RolleRepo } from '../repo/rolle.repo.js';

export class RolleNameUniqueOnSsk extends CompositeSpecification<Rolle<boolean>> {
    public constructor(private readonly rolleRepo: RolleRepo) {
        super();
    }

    public async isSatisfiedBy(rolle: Rolle<boolean>): Promise<boolean> {
        return this.validateRolleNameIsUniqueOnSSK(rolle);
    }

    private async validateRolleNameIsUniqueOnSSK(rolle: Rolle<boolean>): Promise<boolean> {
        const rollen: Option<Rolle<true>[]> = await this.rolleRepo.findByName(rolle.name, true);

        if (!rollen) return true;

        const rollenOnSameSSK: Rolle<true>[] = rollen.filter(
            (existingRolle: Rolle<true>) =>
                existingRolle.administeredBySchulstrukturknoten === rolle.administeredBySchulstrukturknoten,
        );

        return !rollenOnSameSSK.some((existingRolle: Rolle<true>) => existingRolle.name === rolle.name);
    }
}
