/* v8 ignore file @preserv */
// types can not be covered by v8, since the code does not exist at runtime

// Partial, actual structure contains more data
export type CreateGroupParams = {
    id: string;

    name: string;
    type: 'Unspecified' | 'Site' | 'School' | 'Course' | 'CourseGroup';

    parentId: string;
    relationLabel?: string;

    longDescription?: string;
    fullDescription?: string;
};
