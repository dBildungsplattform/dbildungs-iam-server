import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleModule } from './console.module.js';
import { DbConsole } from './db.console.js';
import { DbInitConsole } from './db-init.console.js';
import { ConfigTestModule, LoggingTestModule } from '../../test/utils/index.js';

vi.mock('@mikro-orm/nestjs', async () => {
    const actual: Record<string, unknown> = await vi.importActual('@mikro-orm/nestjs');

    const { MikroORM, EntityManager }: typeof import('@mikro-orm/core') = await import('@mikro-orm/core');
    const { SqlEntityManager }: typeof import('@mikro-orm/postgresql') = await import('@mikro-orm/postgresql');
    type SqlEntityManagerType = import('@mikro-orm/postgresql').SqlEntityManager;

    const mockEntityManager: Partial<SqlEntityManagerType> = {};

    const mockMikroORM: Partial<InstanceType<typeof MikroORM>> = {
        em: mockEntityManager as SqlEntityManagerType,
        close: vi.fn(),
        getMetadata: vi.fn(),
    };

    const mikroOrmModule: object =
        typeof actual['MikroOrmModule'] === 'object' && actual['MikroOrmModule'] !== null
            ? actual['MikroOrmModule']
            : {};

    return {
        ...actual,
        MikroOrmModule: {
            ...mikroOrmModule,
            forRootAsync: vi.fn().mockReturnValue({
                module: class MockMikroOrmModule {},
                providers: [
                    { provide: MikroORM, useValue: mockMikroORM },
                    { provide: EntityManager, useValue: mockEntityManager },
                    { provide: SqlEntityManager, useValue: mockEntityManager },
                ],
                exports: [MikroORM, EntityManager, SqlEntityManager],
                global: true,
            }),
        },
    };
});

describe('ConsoleModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, ConsoleModule, LoggingTestModule],
        }).compile();
    });

    afterAll(async () => {
        if (module) {
            await module.close();
        }
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve DbConsole', () => {
            const service: DbConsole = module.get(DbConsole);
            expect(service).toBeInstanceOf(DbConsole);
        });

        it('should resolve DbInitConsole', () => {
            const service: DbInitConsole = module.get(DbInitConsole);
            expect(service).toBeInstanceOf(DbInitConsole);
        });
    });
});
