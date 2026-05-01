# AGENTS.md

## Purpose
This file gives the coding agent a fast map of the `divvy` frontend, so backend-integration tasks can be implemented consistently.

## Stack
- React (Create React App, `react-scripts`)
- React Router (`react-router-dom`)
- Tailwind CSS + custom UI primitives
- Fetch-based API client (`src/api/apiClient.js`)
- Token auth in `localStorage`

## Runbook
- Install: `npm install`
- Dev server: `npm start`
- Tests: `npm test`
- Production build: `npm run build`

## Environment
- Required env var: `REACT_APP_BACKEND_DOMAIN`
- Used by:
  - `src/api/apiClient.js` as base URL for all API calls
  - `src/api/authApi.js` for Google OAuth login URL

Expected example in `.env`:
`REACT_APP_BACKEND_DOMAIN=https://api.example.com`

## Project Map (high value files)
- Entry and routing:
  - `src/index.js`
  - `src/App.js`
- Auth state and guards:
  - `src/context/AuthContext.jsx`
  - `src/hooks/useAuth.js`
  - `src/components/ProtectedRoute.jsx`
- API layer:
  - `src/api/apiClient.js`
  - `src/api/authApi.js`
  - `src/api/groupApi.js`
- Feature pages:
  - `src/CreatingNewGroup.jsx` (dashboard/groups/settings shell)
  - `src/GroupDetailPage.jsx` (group details, expenses/photos/receipts UI)
  - `src/components/Groups/CreateGroupModal.jsx`
  - `src/components/Groups/GroupSettingsModal.jsx`
- Domain models:
  - `src/types/auth.js`
  - `src/types/group.js`

## Route Overview
- Public:
  - `/` (marketing landing)
  - `/register`
  - `/login`
  - `/auth/google/callback`
  - `/google/callback`
  - `/verify-email`
- Protected (`ProtectedRoute`):
  - `/dashboard`
  - `/groups`
  - `/groups/:groupId`
  - `/create`

Protected pages are rendered through `CreateGroup` from `src/CreatingNewGroup.jsx`.

## Backend Integration Contract (current frontend expectation)

### Auth endpoints
- `POST /auth/register`
  - request: `{ email, password, first_name, last_name }`
  - response: token pair with `access_token`, `refresh_token`
- `POST /auth/login`
  - request: `{ email, password }`
  - response: token pair with `access_token`, `refresh_token`
- `GET /auth/google/login`
  - used as redirect target via full backend domain
- `GET /auth/google/complete?code=...`
  - response: token pair

### Group endpoints
- `POST /groups/create-group`
- `GET /groups/user-groups`
- `GET /groups/:groupId`
- `PUT /groups/:groupId`
- `DELETE /groups/:groupId`
- `POST /groups/join/:invitationCode`
- `POST /user-groups/invite-by-email`

### Auth header behavior
- `apiClient` injects `Authorization: Bearer <access_token>` when token exists in `localStorage`.
- `Content-Type: application/json` is default for requests.

## Auth and Session Notes
- Tokens are stored in `localStorage` keys:
  - `access_token`
  - `refresh_token`
  - `user` (serialized from JWT payload)
- JWT payload is parsed client-side (`authApi.parseJWT` + `User.fromJWTPayload`).
- Expiration is checked in `User.isTokenExpired()`.
- No refresh-token flow is implemented yet (important for backend tasks).

## Current Functional vs UI-only Areas
- Functional with backend:
  - Register/login/google callback flow
  - Protected routing
  - Group create/list/update/invite/join calls
- UI-only / local state (not persisted to backend yet):
  - Expense tracking in `GroupDetailPage`
  - Photos/receipts tabs in `GroupDetailPage`
  - Most settings page actions

When implementing new backend integrations, prefer extending `src/api/*` first and then wiring UI.

## Agent Working Rules for this Repo
- Do not hardcode backend URLs in components; use `apiClient` or `authApi`.
- Keep request/response mapping inside `src/api` and `src/types`.
- Preserve existing payload field names used by backend (`first_name`, `group_id`, etc.).
- Keep protected navigation logic centralized in `AuthContext` + `ProtectedRoute`.
- For new API features:
  - add method in `src/api/*`
  - add/extend model in `src/types/*` when needed
  - consume via component/hook
- Avoid breaking current localStorage auth keys unless a migration is part of task.

## Known Caveats
- `react-router-dom` is v7 while app uses v6-style APIs (`Routes`, `Route`, `Navigate`); currently works in this project setup but changes to routing should be tested carefully.
- `src/CreatingNewGroup.jsx` contains mixed concerns (dashboard, groups, settings). Refactors should be incremental.
- There are duplicate-looking path entries in file indexing caused by path separator differences; treat this as environment artifact unless confirmed otherwise.

## Suggested First Steps for Backend Tasks
1. Confirm backend endpoint path + payload + response shape.
2. Add/adjust `src/api/*` method.
3. Update or add typed model in `src/types/*`.
4. Wire UI state loading/error handling.
5. Verify with manual flow in browser (`npm start`) for affected route.
