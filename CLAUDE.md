# OpenCreator — Claude Working Instructions

## Project Identity
- **App**: OpenCreator — Content creation and digital media tools
- **GitHub**: https://github.com/Open-Scaffold-Labs/OpenCreator
- **Organization**: Open-Scaffold-Labs
- **Publisher**: Open Scaffold Labs
- **Founder**: Dale Raaen (draaen@mac.com / GitHub: draaen-jpg)

## CRITICAL: Tool Usage

### Git & Mac filesystem → Desktop Commander ONLY
The VM sandbox has an HTTP proxy that blocks HTTPS to github.com.
Bash tool git commands will always fail.

**Always use `mcp__desktop-commander__start_process` for:**
- `git pull`, `git push`, `git log`, `git status`, `git commit`
- Any file read/write on the Mac
- npm/node commands run from the actual project

**Never use the VM Bash tool for git or Mac filesystem operations.**

### Seed Files
Seed files must use `module.exports = async function()` pattern.
Never use standalone scripts with `process.exit()` — they crash the server.

## Open Scaffold Ecosystem

This app is part of the Open Scaffold Labs ecosystem — a family of vertical SaaS applications sharing one PostgreSQL database, one component library, and one launcher.

### Tech Stack (All Apps)
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Express.js + PostgreSQL (direct queries, no ORM)
- **Auth**: JWT + bcrypt. Shared `users` table.
- **Shared core**: `@openscaffold/core` linked via file: reference

### Code Conventions
- React components: PascalCase (`DispatchPage.jsx`)
- Route files: kebab-case (`field.js`)
- API paths: `/api/kebab-case`
- Database tables: `prefix_snake_case`
- CSS: Tailwind utilities only (no custom CSS)
- Token keys: prefixed in localStorage (e.g., `fs_token`, `oia_token`)

### Document Standards
Always read `openscaffold-core/DOCUMENT-STANDARDS.md` before generating .docx files.
Use Electric Indigo (#4F46E5) title block, Times New Roman 11pt, justified text, navy headings (#1B3A5C).

## This App

### Ports
- **Client**: http://localhost:5180
- **Server**: http://localhost:3012

### Database
- **Table prefix**: `oc_`
- **Shared DB**: `postgresql://[user]@localhost:5432/openfirehouse`
- Token key: `oc_token`

### Structure
```
OpenCreator/
├── client/
│   ├── src/components/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/routes/
│   ├── src/index.js
│   └── package.json
└── CLAUDE.md
```
