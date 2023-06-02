import { Injectable } from "@nestjs/common";
import { PersonRepo } from "./person.repo.js";
import { CreatePersonRequest, CreatePersonResponse } from "./dto/index.js";

@Injectable()
export class PersonService {
    public constructor(private readonly personRepo: PersonRepo) {}

    public async create(request: CreatePersonRequest): Promise<Result<CreatePersonResponse>> {
        const person = request.toPersonEntity();
        const result = await this.personRepo.findByName(person);
        if (!result) {
            return { ok: false, error: new Error("Person already exists.") };
        }
        return { ok: true, value: new CreatePersonResponse() };
    }
}
