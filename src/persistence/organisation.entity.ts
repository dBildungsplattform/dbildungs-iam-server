import { SchoolStructureNodeEntity } from './school-structure-node.entity';
import { Entity } from '@mikro-orm/core';

@Entity({ discriminatorColumn: 'nodeType', discriminatorValue: 'organisation' })
export class OrganisationEntity extends SchoolStructureNodeEntity {}
