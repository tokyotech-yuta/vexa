/** Bot display name — the participant name the notetaker joins meetings with.
 *
 *  `NEXT_PUBLIC_BOT_NAME=<name>` brands every bot this terminal sends (every send path passes
 *  it to POST /bots as `bot_name`). Unset (the default) keeps "Vexa".
 *
 *  NEXT_PUBLIC_* is inlined into the client bundle at BUILD time (like NEXT_PUBLIC_TERMINAL_MODE
 *  — see ./mode.ts) — changing the name requires a rebuild. Read via a function (not a module
 *  constant) so tests observe the env at call time.
 */
export function botName(): string {
  return process.env.NEXT_PUBLIC_BOT_NAME || "Vexa";
}
