import { SchoolStructureNodeEntity } from './school-structure-node.entity.js';
import { Entity } from '@mikro-orm/core';

@Entity({ discriminatorColumn: 'nodeType', discriminatorValue: 'organisation' })
export class OrganisationEntity extends SchoolStructureNodeEntity {}
