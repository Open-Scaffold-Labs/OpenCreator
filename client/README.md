# Open Creator - YouTube Creator Platform

Part of the OpenScaffold ecosystem. A full-featured React application for YouTube creators to manage content, finances, partnerships, and business operations.

## Quick Start

```bash
npm install
npm run dev
```

The app will run on **http://localhost:5180** and proxy API requests to **http://localhost:3012**.

## Architecture

### Core Configuration
- **Port**: 5180 (Vite dev server)
- **API Port**: 3012 (Express backend)
- **Token Key**: `oc_token` (localStorage)
- **User Key**: `oc_user` (localStorage)

### Tech Stack
- **React 19** with hooks
- **Vite 6** for fast development
- **Tailwind CSS 3.4** for styling
- **Lucide React** for icons
- **No external component library** (self-contained)

### Project Structure

```
client/
├── index.html                 # Entry point
├── package.json              # Dependencies
├── vite.config.js            # Vite config (port 5180, API proxy)
├── tailwind.config.js        # Tailwind theme
├── postcss.config.js         # PostCSS setup
├── src/
│   ├── main.jsx              # React 19 createRoot
│   ├── App.jsx               # Main app with auth & routing
│   ├── index.css             # Tailwind directives
│   ├── components/
│   │   ├── Layout.jsx        # Sidebar + main layout
│   │   ├── StandardHeader.jsx # Top bar with app switcher
│   │   └── LoginScreen.jsx   # Login/signup form
│   └── pages/
│       ├── Dashboard.jsx     # Main overview
│       ├── Pipeline.jsx      # Kanban content pipeline
│       ├── Calendar.jsx      # Content calendar
│       ├── Analytics.jsx     # Channel analytics
│       ├── Finances.jsx      # Revenue & expenses overview
│       ├── Revenue.jsx       # Revenue tracking
│       ├── Expenses.jsx      # Expense tracking
│       ├── Brands.jsx        # Sponsorship CRM
│       ├── Deals.jsx         # Brand deal tracker
│       ├── Team.jsx          # Team member management
│       ├── Equipment.jsx     # Equipment inventory
│       └── Settings.jsx      # Account settings
```

## Features

### Dashboard
- Welcome message with user name
- Stats cards: Total Videos, Subscribers, Revenue, Active Deals
- Quick action buttons: New Video, Add Revenue, New Brand
- Recent content list with fetched data

### Content Management
- **Pipeline**: Kanban-style content production board with stages (Ideation, Filming, Editing, Published, Archived)
  - Drag-or-move cards between stages
  - Content type badges (Video, Short, Post, Live)
  - Create new content inline
  
- **Calendar**: Monthly grid view + upcoming events list
  - Event types: upload, filming, livestream, sponsorship_deadline, meeting
  - Color-coded event badges

### Business Operations
- **Analytics**: Channel performance tracking with snapshots
  - Subscribers, views, watch hours, revenue history
  - Add new analytics snapshots
  
- **Finances**: Complete financial dashboard
  - Summary: Total Revenue, Total Expenses, Net Profit
  - Revenue tracking by source (AdSense, Sponsorship, Affiliate, etc.)
  - Expense tracking by category (Equipment, Software, Freelancer, etc.)
  
- **Revenue**: Dedicated revenue tracking page
  - Add revenue entries with source and description
  - View revenue history table
  
- **Expenses**: Dedicated expense tracking page
  - Add expenses with category and description
  - Total expense summary

### Partnerships
- **Brands**: Sponsorship CRM
  - Brand cards with contact info and status
  - Status options: prospect, contacted, negotiating, active, completed, declined
  - Industry categorization
  
- **Deals**: Brand deal tracking
  - Deal amount and status
  - Accept, reject, or complete deals
  - Deal descriptions and notes

### Team & Assets
- **Team**: Team member management
  - Roles: Editor, Thumbnail Designer, Researcher, Community Manager, VA
  - Hourly rates and contact info
  - Active/inactive status
  
- **Equipment**: Equipment inventory
  - Equipment categories: Camera, Lens, Audio, Lighting, Computer, Storage, Software
  - Purchase price and warranty status
  - Total asset value calculation

### User Experience
- **Layout**: Collapsible sidebar with navigation
  - Organized into groups: Overview, Content, Business, Assets, Intelligence, Admin
  - Active page highlighting in red
  
- **StandardHeader**: Top navigation bar
  - App switcher with links to other OpenScaffold apps
  - User avatar with initials
  - Notification bell placeholder
  
- **Authentication**: Login/Signup with localStorage persistence
  - Demo credentials provided
  - 5-second auth check timeout on app load
  - Token-based API authentication

## API Integration

All pages make authenticated API requests with this pattern:

```javascript
const token = localStorage.getItem('oc_token');
const res = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Expected Backend Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/me` - Current user (5-second timeout)
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/content` - Get content items
- `POST /api/content` - Create content
- `PATCH /api/content/:id` - Update content (stage move)
- `GET /api/pipeline/stages` - Get pipeline stages
- `GET /api/analytics` - Get analytics snapshots
- `POST /api/analytics` - Add analytics snapshot
- `GET /api/revenue` - Get revenue entries
- `POST /api/revenue` - Add revenue
- `GET /api/expenses` - Get expenses
- `POST /api/expenses` - Add expense
- `GET /api/brands` - Get brands
- `POST /api/brands` - Add brand
- `GET /api/deals` - Get deals
- `POST /api/deals` - Add deal
- `GET /api/team` - Get team members
- `POST /api/team` - Add team member
- `GET /api/equipment` - Get equipment
- `POST /api/equipment` - Add equipment
- `GET /api/calendar` - Get calendar events
- `POST /api/calendar` - Add calendar event
- `POST /api/settings` - Save user settings

## Styling

### Color Theme
- **Primary Red**: `#DC2626` (YouTube-inspired)
- **Dark Background**: `#1E1B4B` (Deep indigo)
- **Accent Red**: `#EF4444`
- **Dark Slate**: `#0F172A` (`bg-slate-950`)
- **Gray**: `#64748B` (`text-slate-400`)

### Tailwind Components
- All styling uses Tailwind CSS utility classes
- No custom CSS files (pure Tailwind)
- Responsive grid layouts
- Dark mode by default

## Development Tips

1. **Auth Flow**: Check `App.jsx` for authentication logic
2. **Page Adding**: Import new pages in `App.jsx` and add to `PAGE_REGISTRY`
3. **Icons**: All icons from `lucide-react`
4. **Forms**: Pattern used consistently across all pages (state + fetch + error handling)
5. **Loading States**: Spinner component used on all async pages

## Build & Deploy

```bash
npm run build      # Create optimized build in dist/
npm run preview    # Preview production build locally
```

Built files will be in the `dist/` directory ready for deployment.
