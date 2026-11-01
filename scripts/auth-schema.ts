// Prints the SQL Better Auth needs for our options against an empty SQLite
// database. Run: node --experimental-strip-types scripts/auth-schema.ts
import { DatabaseSync } from "node:sqlite";
import { getMigrations } from "better-auth/db/migration";
import { emailOTP } from "better-auth/plugins";

import { authUserFields } from "../src/modules/accounts/server/authSchema.ts";

const { compileMigrations } = await getMigrations({
  database: new DatabaseSync(":memory:"),
  user: { additionalFields: authUserFields },
  plugins: [emailOTP({ sendVerificationOTP: async () => {} })],
});
console.log(await compileMigrations());
