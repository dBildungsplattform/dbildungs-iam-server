import { Module } from "@nestjs/common";
import { PersonRepo } from "./person.repo.js";
import { PersonService } from "./person.service.js";

@Module({
    providers: [PersonRepo, PersonService],
    exports: [PersonService],
})
export class PersonModule {}
