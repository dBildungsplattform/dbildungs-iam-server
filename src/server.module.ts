import { Module } from "@nestjs/common";
import { PersonApiModule } from "./modules/person/person-api.module.js";

@Module({
    imports: [PersonApiModule],
})
export class ServerModule {}
