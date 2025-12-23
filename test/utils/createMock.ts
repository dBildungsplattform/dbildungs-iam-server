export type DeepMocked<T> = ReturnType<typeof vi.mockObject<T>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMock<T extends object>(T: new (...args: any[]) => T, implementation?: Partial<T>): DeepMocked<T> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
    const instance: T = Object.create(T.prototype);
    return vi.mockObject<T>(Object.assign(instance, implementation));
}
