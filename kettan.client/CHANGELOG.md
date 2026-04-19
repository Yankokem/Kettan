This file explains how Visual Studio created the project.

The following tools were used to generate this project:
- create-vite

The following steps were used to generate this project:
- Create react project with create-vite: `npm init --yes vite@latest kettan.client -- --template=react-ts  --no-rolldown --no-immediate`.
- Update `vite.config.ts` to set up proxying and certs.
- Add `@type/node` for `vite.config.js` typing.
- Update `App` component to fetch and display weather information.
- Create project file (`kettan.client.esproj`).
- Create `launch.json` to enable debugging.
- Add project to solution.
- Update proxy endpoint to be the backend server endpoint.
- Add project to the startup projects list.
- Write this file.

## 2026-04-18

- Implemented role-based default Active status tabs on Orders page (`/orders`).
- Role default behavior:
	- HqManager and TenantAdmin default to PendingApproval.
	- HqStaff defaults to Approved.
- Active mode now uses status chips/tabs; History mode continues using status dropdown.
- Orders list remains mock-data driven while backend/API persistence is pending.
