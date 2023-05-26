import { Module } from "@nestjs/common";
import UserService from "./user.service";
import UserUc from "./user.uc";

@Module({
    providers: [UserService, UserUc],
    exports: [UserService, UserUc],
})
export default class UserModule {}
