# RTS Extension Template

Template repository for The Road to Somewhere Streamer.bot extensions.

## Structure

```text
site/rts.json                         Product and website configuration
RTS Extension - Import Code.txt      Required Streamer.bot import-code source
streamerbot/SetExtensionDllRequirements.cs  Per-extension RtsUI requirements
streamerbot/RtsUiDllCheck.cs         Shared RtsUI.dll check/install/update action
streamerbot/Settings.cs               Extension settings UI action
assets/images/                        Optional extension images
assets/video/                         Optional extension video
overlay/index.html                    Base OBS browser-source page
overlay/overlay.css                   Base overlay styles
overlay/overlay.js                    Base Streamer.bot WebSocket client
```

## Create an extension

1. Copy this repository to a new extension repository.
2. Update `site/rts.json` with the real extension information.
3. Build the Streamer.bot extension and add its source code.
4. Export the required Streamer.bot actions and replace the contents of `RTS Extension - Import Code.txt`. Keep the source filename unchanged.
5. In `SetExtensionDllRequirements.cs`, replace the extension name and minimum RtsUI.dll version.
6. Keep `RtsUiDllCheck.cs` unchanged unless the shared DLL check itself needs a generic fix.
7. Replace `Settings.cs` with the extension's RtsUI settings while keeping the Settings action separate from the DLL check.
8. Add extension-owned assets under `assets/` and customise the overlay when needed.
9. Create a version tag and GitHub release.
10. Add the new repository to `products/sources.json` in the RTS website repository when it is ready to be published.

The template repository itself must not be added to the RTS product registry.

## Visibility

Set `visibility` in `site/rts.json` to `private` for extensions that should only be accessible to RTS administrators. If the field is omitted, the RTS site importer defaults it to `public`.

Private extensions are excluded from public extension listings and require administrator access on their product page.

## RtsUI DLL check

Extensions that use RtsUI.dll use three actions in this order:

```text
Execute Code (Set Extension Dll Requirements)
    -> Action (RTS - UI DLL Check)
    -> Execute Code (Open Settings Dialog)
```

The first action sets these action arguments:

```text
rts.extensionName
rts.minimumRtsUiVersion
```

The generic DLL check reads those arguments and handles installation and updates. It does not reference RtsUI.dll itself, so it can run before the library is installed.

The settings action then references RtsUI.dll and opens the extension-specific RtsUI interface.

This keeps the shared DLL logic identical across extensions while allowing each extension to declare its own minimum supported RtsUI version.

## Base overlay

The `overlay/` directory is the standard RTS overlay foundation. It is based on the WebSocket architecture proven by the RTS Action Replay POC.

`overlay.js` connects to the local Streamer.bot WebSocket, subscribes to `Custom` events, validates the standard event envelope, and exposes matching events through `window.rtsOnEvent(eventName, args, message)`. Set `RTS_OVERLAY.eventName` when an overlay should listen for one specific Custom Event; leave it `null` to receive all Custom Events.

Extension-specific behaviour and UI belong in the extension overlay. The base overlay does not contain product-specific commands or UI.

## Import-code filename

The source file always keeps the stable name:

`RTS Extension - Import Code.txt`

The release build automatically publishes it using the extension name and release version:

`Extension Name v1.2.3 - Import Code.txt`

The import code is manually maintained. The build changes the published filename only; it does not generate or modify the Streamer.bot import code.

## Publishing

The release workflow always publishes the versioned import-code asset.

When `publish.overlay` is true in `site/rts.json`, the workflow also packages the `overlay/` directory and publishes it as the release asset named `overlay`. The RTS website importer uses that asset to publish the overlay files and versioned overlay ZIP.

Keep extension-specific website content in `site/rts.json`. Do not edit generated website files.
