# Private Cloudflare storage

Deployed on 2026-10-25.

- App: https://laptime-tracker.aaronbasil9400.workers.dev/
- Account: b94afbadc132814062291afba7c06c0c
- Worker: laptime-tracker
- Owner: aaronbasil9400@gmail.com
- Database: laptime-tracker-db, region APAC
- Database ID: 4dfefea6-2353-4c7c-a209-1bb839f7c9f8
- D1 binding: DB
- Access application: 66d79f48-7243-459f-84e4-4c65e8ae2feb
- Access policy: Owner only, exact owner email, all production and preview traffic
- Deployed version: deca97c1-a7a9-4583-b049-3efea69bc18e
- Previous code version: 267f8b90-6180-4b21-9a2d-563f24b1f82b

## Verified

- Remote schema applied and 56 real laps plus one custom Lexus entry imported.
- Unknown lap dates remain NULL in D1 and empty in exported records; session and conditions remain unrecorded.
- Signed-out requests to the homepage and API redirect to Cloudflare Access.
- Owner sign-in loads all 56 laps and confirms the record is saved to D1.
- An unchanged snapshot was successfully saved from the authenticated production browser;
  it advanced the sync revision without changing the 56 lap records.
- Local integration checks covered invalid data, cross-origin writes, simultaneous writers,
  stale revisions, deletion isolation, parameter binding, and 401/403 rejection.
- Browser checks covered offline queuing and successful reconnection.
- Repeating the local seed did not duplicate laps.

## Operation

Open the production URL on each device and sign in with the allowed email. Cloudflare Access
offers Cloudflare sign-in and an email login code. Only the owner can pass the Worker email check.
Wait for **Saved to Cloudflare D1** before assuming another device can see an edit. If offline,
pending changes stay on the device. A stale revision displays a conflict instead of overwriting
newer changes. Download the local backup before replacing unsynced changes with the cloud record.

The original 56-lap JSON backup remains in data/. Export JSON periodically as an independent
backup. A code rollback does not roll back D1 records.

The lap-tracker CLI profile is activated only for this project directory. No credentials or
tokens are stored in the repository. Production Access is managed in Cloudflare's Worker
Access tab; access.dev in wrangler.toml is exclusively a local test identity.

The production release was deployed directly with Wrangler. The implementation and import
backups are tracked in the repository so future Git builds can use the same configuration.

## ACC import, 2026-10-25

Added 22 ACC laps across 8 circuits, skipping the two blank Porsche times at Bathurst
and Spa. Production now has 78 laps: 56 LMU and 22 ACC. No existing lap IDs were replaced.
ACC source backup: data/personal-acc-laptimes-2026-10-25.json. Nordschleife, Bathurst,
Laguna Seca, Spa and the Porsche 992 were matched to the existing ACC roster names.
Dates, sessions and conditions remain unrecorded. The timing circuit count now follows
the selected game filter.
