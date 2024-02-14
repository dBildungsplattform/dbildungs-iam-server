import { EntityManager } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PersonRepository {
    public constructor(private readonly em: EntityManager) {}
}
