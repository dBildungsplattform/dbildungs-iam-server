import { SchulstrukturknotenEntity } from './schulstrukturknoten.entity.js';
import { Entity } from '@mikro-orm/core';

@Entity({ discriminatorColumn: 'nodeType', discriminatorValue: 'organisation' })
export class OrganisationEntity extends SchulstrukturknotenEntity {}
