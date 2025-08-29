import { RollenSystemRecht, RollenSystemRechtEnum } from './systemrecht.js';

describe('RollenSystemRecht', () => {
    describe('getByName', () => {
        it.each(Object.values(RollenSystemRechtEnum))(
            'should return a RollenSystemRecht by name',
            (name: RollenSystemRechtEnum) => {
                const result: RollenSystemRecht = RollenSystemRecht.getByName(name);
                expect(result).toBeDefined();
                expect(result.name).toBe(name);
            },
        );
    });
});
