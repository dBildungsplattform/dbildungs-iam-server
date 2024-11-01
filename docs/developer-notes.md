# Developer Notes

> This site contains general advice and notes that should help developers
> during development and avoid some pitfalls with the used libraries.

## Object Mapping

The use of **Automapper** is deprecated, because it seems to be unmaintained at present.

We are using a library called [Automapper](https://automapperts.netlify.app/) with the [classes strategy](https://automapperts.netlify.app/docs/strategies/classes)
and [camel case naming convention](https://automapperts.netlify.app/docs/mapping-configuration/naming-conventions).
The mapper works annotation based for each property. Every type besides the primitive types (boolean, number, string)
needs the type function in the decorator. Here are some examples:

```typescript

enum SomeEnum {
    Foo,
    Bar,
}

enum SomeStringEnum {
    Foo = 'foo',
    Bar = 'bar',
}

class SomeNestedType {
    @AutoMapper()
    public someBoolean?: boolean;

    @AutoMapper()
    public someNumber?: number;

    @AutoMapper(() => Date)
    public someDate?: Date;
}

class SomeType {
    @AutoMapper()
    public someString?: string;

    @AutoMapper(() => [String])
    public someStringArray?: string[];

    @AutoMapper(() => SomeNestedType)
    public someNestedType?: SomeNestedType;

    @AutoMapper(() => Number)
    public someEnum?: SomeEnum;

    @AutoMapper(() => String)
    public someStringEnum?: SomeStringEnum;
}

```
