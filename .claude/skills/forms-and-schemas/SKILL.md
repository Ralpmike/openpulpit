---
name: forms-and-schemas
description: How to build forms and validation in OpenPulpit — thin pages with a separate *Form component, Zod schemas in each module's schemas/ shared by client and route handler, TypeScript row types in models.ts, react-hook-form with shadcn Field components, and the FormFieldInput molecule. Use this whenever you build or change a form (sign-up, profile, broadcast details, recording edit, report, admin action), write a Zod schema, or add a type for an API row.
---

# Forms and schemas

## Page and form split

- The module page or client container (e.g. `ProfileEditPage.tsx`) is thin: it owns the RTK Query hooks (`useGetMyProfileQuery`, `useUpdateProfileMutation`), submission, and error banners. The form receives `defaultValues` and an `onSubmit` prop; it never calls the store itself.
- Field layout lives in a co-located `*Form.tsx` (e.g. `PreacherProfileForm.tsx`, `BroadcastDetailsForm.tsx`, `ReportForm.tsx`) that owns the form, every field, and the submit button. Nothing about page chrome.
- Forms are client components (`'use client'`); the page around them can stay a server component.
- Keep the split even for short forms. It makes testing and reuse easy.

## Schemas live in the module's `schemas/`

- Every Zod schema and its inferred type lives in `@/modules/<module>/schemas/<name>.ts` (`accounts/schemas/profile.ts`, `broadcasting/schemas/broadcast.ts`, `moderation/schemas/report.ts`).
- **The same schema validates the form and the route handler.** Schema files import nothing from the client or the server, only `zod` and shared rules.
- Export both the schema and the type:

```ts
export const broadcastDetailsSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).default(''),
  biblePassage: biblePassageSchema.optional(),
});
export type BroadcastDetailsFormValues = z.infer<typeof broadcastDetailsSchema>;
```

- Shared rules (display name, public slug, Nigerian state and city, Bible passage reference, https URL, email) go in `@/lib/schemas/common.ts` and are composed into object schemas, never repeated.
- Every free-text field has a `max()`; titles, bios and report text are untrusted (see `broadcasting-rules`).
- Never define a schema inside a component or a route handler.

## Types live in `models.ts`

- `@/modules/<module>/models.ts` holds TypeScript types for API rows only: `Preacher`, `Broadcast`, `Recording`, `Report`.
- D1 has no type generator, so these are written by hand. Keep them in step with `migrations/*.sql` and the module's `server/repo.ts`; change all three in the same commit (see `d1-schema`).
- No Zod and no `z.object` in `models.ts`.

## Fields

- Forms use `react-hook-form` with `zodResolver`, laid out with shadcn's `FieldGroup` + `Field` (`FieldLabel`, `FieldDescription`, `FieldError`), connected through react-hook-form's `Controller`. Never a raw `div` with `space-y-*` for form layout. Follow the `shadcn` skill's forms rules.
- Invalid fields: `data-invalid` on `Field`, `aria-invalid` on the control.
- When the `Controller` + `Field` + `FieldLabel` + `Input` + `FieldError` block appears twice or more in a file, use the `FormFieldInput` molecule in `@/components/ui/molecules/`. It takes `label`, `name`, `control`, `data-testid`, and passes through `Input` props.
- Choices of 2–7 options (role at sign-up, report reason, playback speed) use `ToggleGroup` or `RadioGroup`; longer lists (Nigerian states, denominations) use a searchable `Combobox`.
- Location is state then city (requirement 3); states come from a fixed list of the 36 states and the FCT.
- Mobile keyboards: set `type`, `inputMode` and `autoComplete` (`email`, `name`, `one-time-code`) so phones show the right keyboard and autofill.
- Photo upload: accept images only, resize and compress in the browser before upload, show a preview, and limit size (avatars are small on slow data).

## Keep forms short

Preachers fill these in on a phone, often minutes before they preach (goal: signed up and live within five minutes). Ask only for what the feature needs now; everything else gets a sensible default and can be edited later. Going live needs only a title.

## Submit

- The submit button is a `LoaderButton` bound to the mutation's `isLoading` (aliased, e.g. `isUpdateProfilePending`); it shows a spinner while the mutation runs and is disabled from the first click.
- Form values are local react-hook-form state; don't mirror them into Redux.
- Server errors for a field (slug taken) are set with `setError` on that field; other errors follow `loading-and-errors`.
