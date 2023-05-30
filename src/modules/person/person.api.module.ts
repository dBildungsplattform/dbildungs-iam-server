import { Module } from "@nestjs/common";
import PersonController from "./person.controller";
import PersonModule from "./person.module";

@Module({
    controllers: [PersonController],
    imports: [PersonModule],
})
export default class PersonApiModule {}
