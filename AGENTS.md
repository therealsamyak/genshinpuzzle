In all interactions, **be extremely concise and sacrifice grammar for the sake of concision**.

## Deno

This project uses Deno as the runtime. All scripts and configurations should be written with Deno in mind.

Do NOT create a root `deno.json` file. We put everything within the `package.json` file instead.

There is a `deno.json` file within the `supabase` directory. This is for the Supabase Edge functions.
There is a `deno.json` file within the `scripts` directory. This is for helper Deno scripts that are run before the build process.
