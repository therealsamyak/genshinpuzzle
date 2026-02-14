## Deno

This project uses Deno as the runtime. All scripts and configurations should be written with Deno in mind.

Do NOT create a root `deno.json` file. We put everything within the `package.json` file instead.

## React Red Flags

🚩 Generic `handleClick` / `handleSubmit`

- Poorly named, loses colocation, need new names each time
- Use inline handlers with descriptive function names instead

🚩 Overusing `useMemo`

- Only memoize props passed to expensive children
- Leaf components can over-render without issues
- React Compiler handles memoization when enabled

🚩 `<div onClick>`

- Use proper buttons with keyboard control and accessibility
- Divs are not interactive elements

🚩 `fetch` inside `useEffect`

- Prefer server actions or data fetching libraries
- Effects run more often than expected

🚩 Unnecessary `useEffect`

- Read https://react.dev/learn/you-might-not-need-an-effect
- Only use for browser APIs, subscriptions, external integrations

🚩 "hooks" directory

- Co-locate hooks with components that use them
- Separating by function type splits related code

🚩 Multiple CSS files

- One global CSS file is fine (e.g., globals.css with shadcn/ui)
- Multiple CSS files indicate architectural issues
