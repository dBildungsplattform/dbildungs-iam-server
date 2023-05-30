export type PersonDOProps = Readonly<PersonDO>;

export default class PersonDO {
    public id: string;

    public constructor(props: PersonDOProps) {
        this.id = props.id;
    }
}
