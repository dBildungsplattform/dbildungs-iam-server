export interface SeedFile {
    entityName: string;
}

export interface EntityFile<T> extends SeedFile {
    entities: T[];
}
