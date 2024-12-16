import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { Entity, Enum, Opt, Property } from '@mikro-orm/core';
import { ImportStatus } from '../domain/import.enums.js';

@Entity({ tableName: 'importvorgang' })
export class ImportVorgangEntity extends TimestampedEntity {
    @Property({ columnType: 'uuid', nullable: true })
    public readonly importByPersonId?: string;

    @Property()
    public readonly importByUsername!: string;

    @Property({ columnType: 'uuid', nullable: true })
    public readonly rolleId?: string;

    @Property()
    public rollename!: string;

    @Property({ columnType: 'uuid', nullable: true })
    public readonly organisationId?: string;

    @Property()
    public organisationsname!: string;

    @Property({ type: 'int' })
    public dataItemCount!: number;

    @Enum({
        items: () => ImportStatus,
        nativeEnumName: 'import_status_enum',
        onCreate: () => ImportStatus.STARTED,
    })
    public status!: ImportStatus & Opt;

    @Property({ type: 'int' })
    public totalDataItemImported!: number;
}
