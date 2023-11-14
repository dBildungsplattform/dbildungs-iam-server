import { EntityClass, Primary, Ref, Reference } from '@mikro-orm/core';

export function optionalRef<T extends object>(entityType: EntityClass<T>, pk?: Primary<T>): Ref<T> | undefined {
    if (pk === undefined) {
        return undefined;
    }

    return Reference.createFromPK(entityType, pk);
}
