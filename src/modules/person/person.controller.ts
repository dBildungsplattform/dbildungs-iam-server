import { Controller, Post } from "@nestjs/common";

@Controller({ path: "person" })
export class PersonController {
    @Post()
    public create(): unknown {
        throw new Error("Method not implemented");
    }
}
