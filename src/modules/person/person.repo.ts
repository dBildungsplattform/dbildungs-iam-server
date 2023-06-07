import { EntityManager } from "@mikro-orm/postgresql";
import { EntityName } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { RepoBase } from "../../shared/data/index.js";
import { PersonEntity } from "./person.entity.js";

@Injectable()
export class PersonRepo extends RepoBase<PersonEntity> {
    public constructor(em: EntityManager) {
        super(em);
    }

    public override get entityName(): EntityName<PersonEntity> {
        return PersonEntity;
    }

    public async findByName(name: string): Promise<Option<PersonEntity>> {
        await Promise.resolve(name);
        throw new Error();
    }
}
