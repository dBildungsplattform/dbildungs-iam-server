import { Entity } from "@mikro-orm/core";
import { EntityBase } from "../../shared/data/index.js";

export type PersonEntityProps = Readonly<PersonEntity>;

@Entity({ tableName: "person" })
export class PersonEntity extends EntityBase {}
