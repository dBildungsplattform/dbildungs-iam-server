import { Module } from "@nestjs/common";
import PersonApiModule from "@root/modules/person/person.api.module";

@Module({
    imports: [PersonApiModule],
})
export default class ServerModule {}
