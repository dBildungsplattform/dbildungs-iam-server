import { Module } from "@nestjs/common";
import { PersonRepo } from "./person.repo.js";
import { PersonService } from "./person.service.js";
import { PersonProfile } from "./person.profile.js";

@Module({
    providers: [PersonProfile, PersonRepo, PersonService],
    exports: [PersonProfile, PersonService],
})
export class PersonModule {}
