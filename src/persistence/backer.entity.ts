import { SchoolStructureNodeEntity } from './school-structure-node.entity.js';
import { Entity } from '@mikro-orm/core';

@Entity({ discriminatorColumn: 'nodeType', discriminatorValue: 'sponsor' })
export class BackerEntity extends SchoolStructureNodeEntity {}
