export type DeepMocked<T> = ReturnType<typeof vi.mockObject<T>>;

export function createMock<T extends object>(clazz: { prototype: T }, implementation?: Partial<T>): DeepMocked<T> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const instance: T = Object.create(clazz.prototype);
    const mockObject: DeepMocked<T> = vi.mockObject<T>(Object.assign(instance, implementation));
    return mockObject;
}
