import { Module } from "@nestjs/common";
import UserController from "./user.controller";
import UserModule from "./user.module";

@Module({
    controllers: [UserController],
    imports: [UserModule],
})
export default class UserApiModule {}
