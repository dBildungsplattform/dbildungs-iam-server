import { Mapper } from "@automapper/core";
import { InjectMapper, getMapperToken } from "@automapper/nestjs";
import { Injectable } from "@nestjs/common";
import { CreatePersonDO, PersonDO } from "./dto/index.js";
import { PersonRepo } from "./person.repo.js";
import { PersonEntity } from "./person.entity.js";
import { DomainError, PersonAlreadyExistsError } from "../../shared/index.js";

@Injectable()
export class PersonService {
    public constructor(
        private readonly personRepo: PersonRepo,
        @InjectMapper(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    public async createPerson(person: CreatePersonDO): Promise<Result<PersonDO, DomainError>> {
        const newPerson = this.mapper.map(person, CreatePersonDO, PersonEntity);
        const personName = ""; // TODO: set name
        const foundPerson = await this.personRepo.findByName(personName);
        if (foundPerson) {
            return { ok: false, error: new PersonAlreadyExistsError(personName) };
        }
        await this.personRepo.save(newPerson);
        return { ok: true, value: this.mapper.map(newPerson, PersonEntity, PersonDO) };
    }
}
