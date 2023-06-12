import { PostgreSqlContainer, StartedTestContainer } from 'testcontainers';

export class ContainerFactory {
    private static readonly startedTestContainers: StartedTestContainer[] = [];

    public static async close(): Promise<void> {
        const promises = this.startedTestContainers.map((testContainer) => testContainer.stop());
        await Promise.all(promises);
    }

    public static async createPostgres(): Promise<StartedTestContainer> {
        const postgres = await new PostgreSqlContainer().start();
        this.startedTestContainers.push(postgres);
        return postgres;
    }
}
