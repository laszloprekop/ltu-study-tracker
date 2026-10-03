# Only the Maintainer's Sync Token is stored

A Canvas personal access token can do everything its owner can, including submitting work and
posting, and LTU's Canvas offers no read-only scope. So the server stores exactly one: a Sync Token
the Maintainer creates for this purpose alone, with an expiry date, kept encrypted in Supabase Vault,
readable only by the hourly Course Plan sync, and used through a client that can only GET from a
fixed list of endpoints. A Student's token stays in their browser and passes through the relay
without being written anywhere, so their Canvas data refreshes when they open the app.

## Considered Options

- Store every Student's token encrypted: background sync for all, but one breach exposes thirty
  accounts.
- Run the sync on the Maintainer's machine: no token on the server, but teacher changes stall
  whenever that machine is off.
- Refresh the shared Course Plan from whichever Student visits: no stored token, but one Student's
  extension or early unlock would leak into everyone's plan.

## Consequences

Nothing can warn a Student who has not opened the app. When notifications are added, Students may
opt in to storing their own token the same way as the Sync Token; until then, never.
