import { SchulstrukturknotenEntity } from './schulstrukturknoten.entity.js';
import { Entity } from '@mikro-orm/core';

@Entity({ discriminatorColumn: 'nodeType', discriminatorValue: 'traeger' })
export class TraegerEntity extends SchulstrukturknotenEntity {}
