# Tests with Automapper

In the long run the goal is to remove the AutoMapper from the project because it is no longer maintained.
Nevertheless, we want to collect and document possible issues here when using Automapper in tests.

If tests throw an error, stating that a mapping already exists e.g. like the following:
```bash
 Mapping for source class PersonDo {
    /**
     * @deprecated This constructor is for automapper only.
     */
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
    constructor() {
    this.mandant = '';
    this.familienname = '';
    this.vorname = '';
  }
} and destination class PersonEntity extends timestamped_entity_js_1.TimestampedEntity {
/**
 * @deprecated This constructor is for automapper only.
 */
    constructor() {
    super();
    this.personenKontexte = new core_1.Collection(this);
    }
} already exists
```
you may want to verify that only really necessary (profile-)mappers are imported in the test file via imports and/or providers section:

In the following test providing `PersonPersistenceMapperProfile` was not necessary anymore after code changes in modules,
`PersonenKontextModule` imports `PersonModule` and `PersonModule` on the other hand imports `PersonPersistenceMapperProfile` already, hence
the mapping-error occurred.

```bash
    beforeAll(async () => {
        module = await Test.createTestingModule({
        imports: [
            ConfigTestModule,
            DatabaseTestModule.forRoot({ isDatabaseRequired: true }),

            PersonenKontextModule,
        ],
        providers: [
            //PersonPersistenceMapperProfile,
            DBiamPersonenkontextRepo,
            RolleRepo,
            RolleFactory,
            ServiceProviderRepo,
            OrganisationRepository,
        ],
    }).compile();
```
