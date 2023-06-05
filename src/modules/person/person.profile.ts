import { MappingProfile } from "@automapper/core";
import { AutomapperProfile } from "@automapper/nestjs";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PersonProfile extends AutomapperProfile {
    public override get profile(): MappingProfile {
        throw new Error("Method not implemented.");
    }
}
