# Open Creator Server

YouTube Creator Operating System - Express.js backend for the OpenScaffold ecosystem.

## Setup

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the server directory:

```
DATABASE_URL=postgresql://localhost:5432/openfirehouse
JWT_SECRET=your-secure-secret-key
NODE_ENV=development
```

If not specified, defaults to:
- `DATABASE_URL`: `postgresql://localhost:5432/openfirehouse`
- `JWT_SECRET`: `your-secret-key`

### Running the Server

**Development** (with hot reload via nodemon):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

Server runs on port `3012`.

## Database

All tables use the `oc_` prefix and share the PostgreSQL database `openfirehouse` with other OpenScaffold apps.

### Tables

- `oc_users` - User accounts (app-scoped mirror of shared users table)
- `oc_channels` - YouTube channel configurations
- `oc_pipeline_stages` - Customizable content workflow stages
- `oc_content` - Video content, shorts, posts, livestreams
- `oc_tasks` - Tasks within content pipeline
- `oc_revenue` - Revenue tracking (AdSense, sponsorships, affiliate, Patreon)
- `oc_expenses` - Business expense tracking
- `oc_brands` - Sponsorship brand CRM
- `oc_deals` - Sponsorship deals
- `oc_analytics_snapshots` - Channel analytics snapshots
- `oc_team_members` - Team member directory
- `oc_equipment` - Equipment inventory
- `oc_calendar_events` - Upload calendar and events
- `oc_contracts` - Contract management

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info (requires auth)

### Content Management

- `GET /api/content` - List all content with stage info
- `POST /api/content` - Create new content item
- `GET /api/content/:id` - Get single content item
- `PUT /api/content/:id` - Update content item
- `DELETE /api/content/:id` - Delete content item
- `PUT /api/content/:id/stage` - Move content to different pipeline stage

### Pipeline Stages

- `GET /api/pipeline/stages` - List all stages for user
- `POST /api/pipeline/stages` - Create new stage
- `GET /api/pipeline/stages/:id` - Get single stage
- `PUT /api/pipeline/stages/:id` - Update stage
- `DELETE /api/pipeline/stages/:id` - Delete stage
- `PUT /api/pipeline/reorder` - Reorder all stages

**Default Pipeline Stages** (created on signup):
1. Idea
2. Research
3. Scripting
4. Filming
5. Editing
6. Thumbnail & Title
7. Review
8. Scheduled
9. Published
10. Analyzing

### Finance

**Revenue**
- `GET /api/revenue` - List revenue entries
- `POST /api/revenue` - Add revenue entry
- `GET /api/revenue/:id` - Get single entry
- `PUT /api/revenue/:id` - Update entry
- `DELETE /api/revenue/:id` - Delete entry

**Expenses**
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Add expense
- `GET /api/expenses/:id` - Get single expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

**Summary**
- `GET /api/finance/summary` - Get P&L summary with breakdowns

### Brand CRM

- `GET /api/brands` - List all brands
- `POST /api/brands` - Create brand
- `GET /api/brands/:id` - Get brand details
- `PUT /api/brands/:id` - Update brand
- `DELETE /api/brands/:id` - Delete brand
- `GET /api/brands/:id/deals` - List deals for brand

### Analytics

- `GET /api/analytics` - List snapshots (with channel_id and limit query params)
- `POST /api/analytics` - Add analytics snapshot
- `GET /api/analytics/:id` - Get single snapshot
- `PUT /api/analytics/:id` - Update snapshot
- `DELETE /api/analytics/:id` - Delete snapshot
- `GET /api/analytics/summary` - Channel summary stats (with optional channel_id)

### Team

- `GET /api/team` - List team members
- `POST /api/team` - Add team member
- `GET /api/team/:id` - Get team member details
- `PUT /api/team/:id` - Update team member
- `DELETE /api/team/:id` - Delete team member

### Equipment

- `GET /api/equipment` - List equipment
- `POST /api/equipment` - Add equipment
- `GET /api/equipment/:id` - Get equipment details
- `PUT /api/equipment/:id` - Update equipment
- `DELETE /api/equipment/:id` - Delete equipment

### Calendar

- `GET /api/calendar` - List events (with date range filter)
- `POST /api/calendar` - Create event
- `GET /api/calendar/:id` - Get event details
- `PUT /api/calendar/:id` - Update event
- `DELETE /api/calendar/:id` - Delete event

## Authentication

Uses JWT (JSON Web Tokens) with a shared `JWT_SECRET` across all OpenScaffold apps.

Tokens are passed via:
```
Authorization: Bearer <token>
```

## Data Scoping

All queries are scoped to the authenticated user (`req.user.id`). Users can only access their own data.

## Database Queries

All queries use parameterized statements (`$1`, `$2`, etc.) to prevent SQL injection.

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request (missing/invalid parameters)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not found
- `500` - Server error
