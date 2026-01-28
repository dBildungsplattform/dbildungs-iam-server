export type DeepMocked<T> = ReturnType<typeof vi.mockObject<T>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMock<T extends object>(T: new (...args: any[]) => T, implementation?: Partial<T>): DeepMocked<T> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
    const instance: T = Object.create(T.prototype);
    const mockObject: DeepMocked<T> = vi.mockObject<T>(Object.assign(instance, implementation));
    // if (implementation) {
    //     for (const key of Object.getOwnPropertyNames(implementation)) {
    //         // Set the return values of the mock to the implementation provided
    //         if ((mockObject[key as keyof typeof mockObject] as Mock).mockReset) {
    //             (mockObject[key as keyof typeof mockObject] as Mock).mockReset();
    //         }
    //         // if (
    //         //     implementation[key as keyof typeof implementation] &&
    //         //     implementation[key as keyof typeof implementation] instanceof Function
    //         // ) {
    //         //     (mockObject[key as keyof typeof mockObject] as Mock).mockImplementation(
    //         //         implementation[key as keyof typeof implementation] as (...args: unknown[]) => unknown,
    //         //     );
    //         // } else if (mockObject[key as keyof typeof mockObject] instanceof Function) {
    //         //     (mockObject[key as keyof typeof mockObject] as Mock).mockReturnValue(
    //         //         implementation[key as keyof typeof implementation] as unknown,
    //         //     );
    //         // } else {
    //         //     mockObject[key as keyof typeof mockObject] = implementation[
    //         //         key as keyof typeof implementation
    //         //     ] as T[keyof T] as unknown as DeepMocked<T>[keyof DeepMocked<T>];
    //         // }
    //     }
    // }
    return mockObject;
}
