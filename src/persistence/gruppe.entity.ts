import { SchulstrukturknotenEntity } from './schulstrukturknoten.entity.js';
import { Entity } from '@mikro-orm/core';

@Entity({ discriminatorColumn: 'nodeType', discriminatorValue: 'gruppe' })
export class GruppeEntity extends SchulstrukturknotenEntity {}
