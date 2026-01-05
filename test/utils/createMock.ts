export type DeepMocked<T> = ReturnType<typeof vi.mockObject<T>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMock<T extends object>(T: new (...args: any[]) => T, implementation?: Partial<T>): DeepMocked<T> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
    const instance: T = Object.create(T.prototype);
    return vi.mockObject<T>(Object.assign(instance, implementation));
}


// export function createMock<T extends object>(T: any, implementation?: Partial<T>): DeepMocked<T> {
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
//     let instance: T = {} as T;
//     for (const key of Object.keys(implementation || {})) {
//         // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
//         instance[key as keyof T] = implementation![key as keyof T]!;
//     }
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
//     if (T.prototype) {
//         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
//         instance = Object.create(T.prototype);
//     }

//     return vi.mockObject<T>(Object.assign(instance, implementation));
// }
