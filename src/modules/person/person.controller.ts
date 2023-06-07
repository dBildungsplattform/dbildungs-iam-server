import { Body, Controller, Post } from "@nestjs/common";
import { CreatePersonBodyParams, CreatePersonDO, CreatePersonResponse, PersonDO } from "./dto/index.js";
import { PersonUc } from "./person.uc.js";
import { Mapper } from "@automapper/core";
import { InjectMapper, MapPipe, getMapperToken } from "@automapper/nestjs";

@Controller({ path: "person" })
export class PersonController {
    public constructor(
        private readonly uc: PersonUc,
        @InjectMapper(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    @Post()
    public async createPerson(
        @Body(MapPipe(CreatePersonBodyParams, CreatePersonDO)) person: CreatePersonDO,
    ): Promise<CreatePersonResponse> {
        const response = this.mapper.map(await this.uc.createPerson(person), PersonDO, CreatePersonResponse);
        return response;
    }
}
