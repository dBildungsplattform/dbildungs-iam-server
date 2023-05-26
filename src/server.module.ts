import { Module } from "@nestjs/common";
import UserApiModule from "./modules/user/user.api.module";

@Module({
    imports: [UserApiModule],
})
export default class ServerModule {}
