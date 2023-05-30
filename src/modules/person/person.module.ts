import { Module } from "@nestjs/common";
import PersonService from "./person.service";
import PersonUc from "./person.uc";

@Module({
    providers: [PersonService, PersonUc],
    exports: [PersonService, PersonUc],
})
export default class PersonModule {}
