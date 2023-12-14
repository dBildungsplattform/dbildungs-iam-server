import { AutoMap } from '@automapper/classes';

import { RolleRepo } from '../repo/rolle.repo.js';

export class Rolle {
    @AutoMap()
    public id?: string;

    @AutoMap()
    public createdAt?: Date;

    @AutoMap()
    public updatedAt?: Date;

    @AutoMap()
    public name!: string;

    @AutoMap()
    public administeredBySchulstrukturknoten!: string;

    public async save(rolleRepo: RolleRepo): Promise<void> {
        const rolle: Rolle = await rolleRepo.save(this);

        Object.assign(this, rolle);
    }
}
