/* v8 ignore file @preserv */
// Used in Seeding only. Not absolutely necessary to test this.

import { Entity } from '@mikro-orm/decorators/legacy';
import { TimestampedEntity } from './timestamped.entity.js';

@Entity({ tableName: 'data_provider' })
export class DataProviderEntity extends TimestampedEntity {}
