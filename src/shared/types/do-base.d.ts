export type DoBase<WasPersisted extends boolean> = {
    id: Persisted<string, WasPersisted>;
    createdAt: Persisted<Date, WasPersisted>;
    updatedAt: Persisted<Date, WasPersisted>;
};
