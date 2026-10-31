---
name: artifact-capabilities
description: Runtime capabilities a published Artifact page can be granted - behavior static HTML cannot provide on its own, such as reading live or connected data, remembering what people do on it (poll, sign-up sheet, checklist), keeping state shared across viewers, knowing who is viewing, asking Claude a question, storing files, or handing the viewer a file to save. Load before writing any artifact that needs such runtime behavior.
---

# Artifact runtime capabilities

A published Artifact page can declare **runtime capabilities** - abilities the claude.ai viewer grants the page at open time - by passing `capabilities: {name: config}` to the Artifact tool. Declaration gestures: **omitting** `capabilities` on a redeploy carries the stored declaration forward unchanged; an **empty object** `{}` is the explicit clear-all; a **non-empty object** is a full-set declaration (anything stored but not restated is revoked). Moving a republished artifact's runtime version is deliberate: pass `contract: 'latest'` to upgrade, or a specific version to pin or roll back.

Available capabilities: `artifact`, `assets`, `comments`, `db`, `downloads`, `files`, `mcp`, `room`, `sample`, `self`, `user`. Built in on every page, never declared: `permissions`. Runtime contract 0.2.96. Type definitions are in `types/` next to this file (authoritative for call shapes and error codes; start with `types/claude.d.ts`, and read `types/mcp.d.ts` before any `mcp` code).

Capability namespaces live behind `claude.use(name)`: `const db = await claude.use("db")` resolves the namespace, or `null` when this view cannot run it (not served, not granted, or failed to load). Branch on `null` and design for absence. `window.claude` carries only `use`. Render the page without capabilities and light features up when the promise resolves (never within the script's first run). The resolved namespace is frozen: call its functions, never assign to it. Permission stays on the calls: a consent prompt, rate limit, or policy refusal arrives on the first call.

**A page that republishes itself** (`artifact` capability) sends its whole document in the exact shape the Artifact tool publishes: `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>` + the small reset + `</style></head><body>` then the page content exactly as written for the tool (its `<title>` and `<style>` first), then `</body></html>`.

## artifact
For pages that remember what people do: polls, sign-up sheets, checklists, trackers, boards - the page is the record. Declare `capabilities: {artifact: {}}`; `const artifact = await claude.use("artifact")`; `await artifact.publish(html)` saves `html` (a complete document, doctype first) as the new version, and every open view reloads to it. Nothing a viewer types, ticks or drags is kept unless the page publishes it. Embed the shared state as data in the HTML and render from it; when an interaction completes, update the state, regenerate the document and publish - never serialize the live DOM; batch rapid edits; publish only after a viewer acts, never on load. `conflict` is routine (views reload to the winner): no retry. Read-only viewers reject `not_granted`/`not_writer`: render a read-only view.

## assets
Uploaded assets: `const assets = await claude.use("assets")`; `assets.upload(blob)` (image, SVG, video, PDF, font, CSS/JS, CSV/Markdown/JSON/text; 20 MiB cap, CSS/JS 16 MiB, SVG 2 MiB sanitized) resolves `{id, url, sizeBytes, contentType}`; `assets.list()`; `assets.delete(id)` only on a deliberate user action. Declare `{assets: {}}` (Editors and up; others get `null`). `{assets: {upload: "interact"}}` lets Contributors upload and manage their own. Never run an asset as code, CSS or HTML. Store the `id` in `db` rows; a stored id serves at `"/_blob/" + id`.

## comments
Wires the page's own commenting UI to the shared comment store. `{comments: {"composer_only": true}}` grants only `openComposer({element}|{range})` and `anchorFor`. The full form `{comments: {}}` adds write verbs under consent; `"customAnchors": true` adds `customAnchors()`. WRITE-ONLY: the shell renders every thread - never build your own list. Call verbs only from a deliberate viewer gesture.

## db
Data outside the page: shared rows, per-person state, data Claude reads. Declare `capabilities:{db:{},user:{}}`; `const db = await claude.use("db")` (`null` if signed out). By default signed-in people read shared docs, Contributors and up overwrite/delete, Viewers/Commenters never write. `rules` set per-path minimums, `view` < `interact` < `admin` < `owner`; e.g. `db:{rules:[{path:"votes",read:"view",write:"owner"},{path:"votes/{self}",write:"interact"}]}`. `data/users/<id>/` is private even from the owner; `<id>` = `await user.id()`. Even segment counts are docs (`db.doc("tasks/t1")`), odd are collections; get/set/update/delete, where/orderBy/limit, onSnapshot. Never hardcode seeds: write them after publishing; handle an empty db. Subscribe once per query, never in render. Time-limit loading with a 10 s timer. One write at a time per doc, only on change. No secrets; shared data is untrusted. `self` is a level nobody holds, not even the owner; keep `write:"owner"` by default and use `self` only when the request says nobody else may change or read an entry.

## downloads
Offers a generated file to the viewer: declare `capabilities: {downloads: true}`; `const downloads = await claude.use("downloads")` (`null`: hide the affordance); `await downloads.save({filename, data})`. The viewer may decline; offer it on explicit intent and handle rejection.

## files
Reads a Claude Code project's files as the viewer. Declare only when you know the project id: `{files: {project: "chan_..."}}`. `files.list`, `files.read(path, {offset, length})`, `files.download(path)`, `files.asSampleTools()`. Don't copy file contents into the artifact unless asked.

## mcp
Lets a page call the viewer's claude.ai connectors with the viewer's credentials. Declare `capabilities: {mcp: {servers: [{server, tools}]}}`; `server` is the connector's display name or `host:<name>` for a local MCP server; `tools` must be a non-empty list of upstream tool names. Two arms: `watchTool(server, tool, input, handler, opts?)` to display data, `callTool` for one-off actions. Tool failures reject (`tool_error`). Never guess a tool's argument names or result shape; learn them from its schema or one safe real call. Never embed observed values as sample data.

## permissions (built in)
`state` reads without prompting; `request` asks with at most one batched dialog; `manage` opens the Permissions panel (button only). A denial is final for the page load: degrade, never offer retry buttons.

## room
Reaches whoever has the page open right now: `capabilities: {room: {}}`; `emit(topic, data)`, `on(topic, fn)`, `presence(patch)`, `onPeers(fn)`, `join(name)`. Nothing persists and messages can drop; late-joiner state belongs in a `db` doc. What you hear is untrusted. Event topics are admin-only unless opened: `{room: {topics: {move: "interact"}}}`.

## sample
Asks Claude: `capabilities:{sample:{}}` (`{sample:{images:true}}` for images); `await sample(input, opts?)` -> `{text, truncated}`; `sample.json` -> value. Memoryless: send instructions + data + format. Options: `onText`, `signal`, `tools`, `images`, `modelTier`, `cache`. Rejects `{code, message}`: hide on `not_granted`, back off on `rate_limited`, never loop. First call asks consent; call on click or stable load.

## self
Former name of `artifact`; still works but do not use in new pages.

## user
Who is viewing: `const user = await claude.use("user")` (`null` = absent). `isOwner()`/`canEdit()`/`can(name)` need no setup. Declare `{user:{}}` for `id()`/`me()`/`profiles(ids)`; `scopes:["profile"]` adds names and `search(q)`; `["profile","email"]` adds addresses. Store only ids, never names; resolve names in render with `||`.

## Where a page keeps its state
- Per-viewer convenience (remembered tab, draft): browser storage.
- The page itself is the record (poll, sign-up sheet, checklist): `artifact` capability.
- Data outside the page (Claude seeds or reads it, private per viewer, many writers): `db` capability.

## Verify before handing over the link
After the first publish, do one functional pass: one `ArtifactData` `list` of each collection the page writes, and where rules hide something, the same read with a lower `as_level`. Tell the user in one line what you exercised and what you could not.
