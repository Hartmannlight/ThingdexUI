# Changelog

## Unreleased

### Changed

- Item and location creation now surfaces label-print side-effect failures instead of reporting an unconditional success.
- Reprints display the typed synchronous send result returned by Thingdex.
- CI builds both SDKs before typechecking and building the UI.
- Production builds use reproducible lockfiles, Node 22, and audited Vite 8 tooling.
