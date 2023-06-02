import { Module } from "@nestjs/common";
import { PersonController } from "./person.controller.js";
import { PersonModule } from "./person.module.js";
import { PersonUc } from "./person.uc.js";

@Module({
    imports: [PersonModule],
    providers: [PersonUc],
    controllers: [PersonController],
})
export class PersonApiModule {}
