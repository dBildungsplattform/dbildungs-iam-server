import { SchoolStructureNodeEntity } from './schoolStructureNode.entity';
import { Entity } from '@mikro-orm/core';

@Entity({ discriminatorColumn: 'nodeType', discriminatorValue: 'sponsor' })
export class SponsorEntity extends SchoolStructureNodeEntity {}
