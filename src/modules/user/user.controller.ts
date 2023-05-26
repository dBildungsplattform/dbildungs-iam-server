import { Controller } from "@nestjs/common";
import UserUc from "./user.uc";

@Controller()
export default class UserController {
    constructor(private readonly uc: UserUc) {}
}
