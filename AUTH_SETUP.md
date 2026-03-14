# Smart City Auth Setup

## User Roles

| Role | Access |
|------|--------|
| **System Admin** | Full city-wide access. All camera feeds, crowd stats, user management. |
| **Location Admin** | Assigned location only. Camera feeds and crowd data for their location (mall, temple, etc.). |
| **Public User** | Dashboard, crowd status, alerts for location of interest. Self-register. |
| **Guest** | View-only crowd status on map. No registration. Must register for alerts. |

## Setup

### 1. Database

PostgreSQL with `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` in `backend/.env`:

```
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=crowdai
```

### 2. Seed Users

```bash
cd backend
python scripts/seed_users.py
```

**Default credentials:**

| Role | Email | Password | Name | Mobile | Location |
|------|-------|----------|------|--------|----------|
| System Admin | systemadmin@smartcity.local | sysadmin123 | System Admin | 9999999999 | - |
| Mall Location Admin | mall_admin@smartcity.local | malladmin123 | Mall Location Admin | 8888888881 | mall |
| Temple Location Admin | temple_admin@smartcity.local | templeadmin123 | Temple Location Admin | 8888888882 | temple |
| Railway Location Admin | railway_admin@smartcity.local | railwayadmin123 | Railway Location Admin | 8888888883 | railway_station |
| Market Location Admin | market_admin@smartcity.local | marketadmin123 | Market Location Admin | 8888888884 | market |
| Bus Stand Location Admin | busstand_admin@smartcity.local | busstandadmin123 | Bus Stand Location Admin | 8888888885 | bus_stand |

### 3. Run

```bash
cd backend && python run.py
cd frontend && npm run dev
```

## Login

- **System Admin**: Use `/admin/login` or main Login. Redirects to admin dashboard.
- **Location Admin**: Use main Login. Redirects to Location Admin dashboard (filtered by assigned place type).
- **Public User**: Register then login via main Login.
