import { Controller } from "@nestjs/common";
import PersonUc from "./person.uc";

@Controller()
export default class PersonController {
    public constructor(private readonly uc: PersonUc) {}

    public create(): unknown {
        throw new Error("Method not implemented");
    }
}
