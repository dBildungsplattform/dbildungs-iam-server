# Code Conventions
This document collects all code conventions we decide on.



## Domain Language

Our Domain Language is **German**. This has been decided on the basis that we
1. Adhere to the SchulConneX standard, which is in german
2. Our Domain translates poorly into English
3. Our clients and intended use are located entirely in Germany

However, everything else we produce, from code to documentation,
will be handled in **English**.

| Type                 | Allowed Languages |
|:---------------------|:-----------------:|
| Entity               |      German       |
| Entity Fields        |      German       |
| Domain Object        |      German       |
| Domain Object Fields |      German       |
| Service/Uc methods   | English / German  |
| Controller methods   | English / German  |
| Controller DTOs      |      German       |

An overview of all Domain and Entity names is found [here](https://docs.dbildungscloud.de/x/fAMGDw).

## Examples

These code snippets are taken directly from our codebase and
gives an example for the currently allowed code style and languages.

#### Entity
```typescript
@Entity({ tableName: 'organisation' })
export class OrganisationEntity extends TimestampedEntity<OrganisationEntity, 'id'> {
  public constructor() {
    super();
  }

  @AutoMap()
  @Property({ nullable: true })
  public kennung?: string;

  @AutoMap()
  @Property({ nullable: true })
  public name?: string;

  @AutoMap()
  @Property({ nullable: true })
  public namensergaenzung?: string;

  ...
}
```

#### Domain Object
```typescript
export class OrganisationDo<WasPersisted extends boolean> implements DoBase<WasPersisted> {

  public constructor() {
  }

  @AutoMap(() => String)
  public id!: Persisted<string, WasPersisted>;

  @AutoMap()
  public kennung?: string;

  @AutoMap()
  public name?: string;

  @AutoMap()
  public namensergaenzung?: string;

  ...
}
```
#### Service
```typescript
@Injectable()
export class OrganisationService {
    public constructor(private readonly organisationRepo: OrganisationRepo) {}

    public async createOrganisation(
        organisationDo: OrganisationDo<false>,
    ): Promise<Result<OrganisationDo<true>, DomainError>> {
        const organisation: OrganisationDo<true> = await this.organisationRepo.save(organisationDo);
        if (organisation) {
            return { ok: true, value: organisation };
        }
        return { ok: false, error: new EntityCouldNotBeCreated(`Organization could not be created`) };
    }
}
```
#### Uc
```typescript
@Injectable()
export class OrganisationUc {
public constructor(
private readonly organisationService: OrganisationService,
@Inject(getMapperToken()) private readonly mapper: Mapper,
) {}

    public async createOrganisation(organisationDto: CreateOrganisationDto): Promise<CreatedOrganisationDto> {
        const organisationDo: OrganisationDo<false> = this.mapper.map(
            organisationDto,
            CreateOrganisationDto,
            OrganisationDo,
        );
        const result: Result<OrganisationDo<true>> = await this.organisationService.createOrganisation(organisationDo);
        if (result.ok) {
            return this.mapper.map(result.value, OrganisationDo, CreatedOrganisationDto);
        }
        throw result.error;
    }
}
```

#### Controller
```typescript
@ApiTags('organisation')
@Controller({ path: 'organisation' })
export class OrganisationController {
    public constructor(
        private readonly uc: OrganisationUc,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    @Post()
    @ApiCreatedResponse({ description: 'The organisation was successfully created.' })
    @ApiBadRequestResponse({ description: 'The organisation already exists.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create the organisation.' })
    @ApiForbiddenResponse({ description: 'Not permitted to create the organisation.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating the organisation.' })
    public async createOrganisation(@Body() params: CreateOrganisationBodyParams): Promise<OrganisationResponse> {
        const organisationDto: CreateOrganisationDto = this.mapper.map(
            params,
            CreateOrganisationBodyParams,
            CreateOrganisationDto,
        );
        const createdOrganisation: CreatedOrganisationDto = await this.uc.createOrganisation(organisationDto);
        return this.mapper.map(createdOrganisation, CreatedOrganisationDto, OrganisationResponse);
    }
}
```
#### Controller DTO
```typescript
export class CreateOrganisationDto {
  @AutoMap()
  public readonly kennung!: string;

  @AutoMap()
  public readonly name!: string;

  @AutoMap()
  public readonly namensergaenzung!: string;
}
```
