import { Entity } from '@mikro-orm/core';
import { EntityBase } from '../../shared/types/index.js';

export type PersonEntityProps = Readonly<PersonEntity>;

@Entity({ tableName: 'person' })
export class PersonEntity extends EntityBase {}
