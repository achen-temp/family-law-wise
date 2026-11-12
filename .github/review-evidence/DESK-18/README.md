# DESK-18 local PDF and image preview

## Before

The preview rendered inside a bordered card of its own. When used on upload and review pages this produced nested framing, separated the filename from open/reselect actions, and gave images and PDFs inconsistent viewing areas. A preview failure message also sat in a separate amber card.

## After

The preview uses one file header and a single gray viewing area. PDF and image content are centered and fit the available space. Failures appear as a compact inline alert with retry and, when supplied by the upload flow, the existing choose-another-file action.

The project contains a seeded demo upload form but no persisted local file fixture. Browser automation opened the form successfully; however, the isolated file chooser did not update the page state, so this PR does not claim an after-state screenshot. The development console only reported the local HMR WebSocket retry.
