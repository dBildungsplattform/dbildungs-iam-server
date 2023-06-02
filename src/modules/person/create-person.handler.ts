import { IRequestHandler } from "mediatr-ts";
import { CreatePersonRequest, CreatePersonResponse } from "./dto/index.js";
import { Injectable } from "@nestjs/common";

@Injectable()
export class CreatePersonHandler implements IRequestHandler<CreatePersonRequest, CreatePersonResponse> {

    public handle(_request: CreatePersonRequest): Promise<CreatePersonResponse> {
        throw new Error("Method not implemented.");
    }
}
