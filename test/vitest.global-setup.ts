import { DatabaseTestModule } from './utils/database-test.module.js';

export default function globalSetup(): () => Promise<void> {
    // Return a teardown function that runs after all tests complete
    return async (): Promise<void> => {
        await DatabaseTestModule.stopContainer();
    };
}
