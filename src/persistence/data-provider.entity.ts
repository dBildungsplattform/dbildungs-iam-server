/* v8 ignore file @preserv */
// Used in Seeding only. Not absolutely necessary to test this.

import { TimestampedEntity } from './timestamped.entity.js';
import { Entity } from '@mikro-orm/core';

@Entity({ tableName: 'data_provider' })
export class DataProviderEntity extends TimestampedEntity {}
