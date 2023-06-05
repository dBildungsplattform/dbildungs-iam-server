import { Injectable } from "@nestjs/common";
import { RepoBase } from "../../shared/db/index.js";
import { PersonEntity } from "./person.entity.js";
import { EntityManager } from "@mikro-orm/postgresql";
import { EntityName } from "@mikro-orm/core";

@Injectable()
export class PersonRepo extends RepoBase<PersonEntity> {
    public constructor(em: EntityManager) {
        super(em);
    }

    public override get entityName(): EntityName<PersonEntity> {
        return PersonEntity;
    }

    public findByName(_person: PersonEntity): Promise<Option<PersonEntity>> {
        throw new Error();
    }
}
