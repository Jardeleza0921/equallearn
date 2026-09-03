# EqualLearn Phase 3.2 — Teacher Designations

Web and mobile now use **Teacher Designations** instead of the limited current-assignment interaction.

Designation states:

- `active` — students use this teacher designation.
- `inactive` — preserved but not used for student/teacher matching.
- `deleted` — soft-deleted/recoverable record.

Available administration actions on both web and mobile:

- Activate
- Deactivate
- Delete (soft delete)
- Retrieve (restores a deleted designation as inactive)

Retrieving as inactive is intentional: restoration and activation are separate administrative actions.

Student assignment lookup and Teacher student scoping now use only `active` designations. Deleted/inactive designations cannot accidentally assign a teacher.

Existing Firestore collection names are preserved (`teacherAssignments`); no destructive Firebase migration is required.
