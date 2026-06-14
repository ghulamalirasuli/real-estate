# Real Estate Platform

A full-stack real estate application with a Laravel backend, React/Vite frontend (TypeScript), and a React Native mobile client. This repository contains three folders: `backend`, `frontend`, and `mobile`.

**Key Features**
- Property listings with images and pricing
- User accounts, subscriptions, and favorites
- Lead capture and messaging
- Payments and subscription billing
- Multi-language support
- Admin reporting and accounting services

**Architecture**
- Backend: Laravel PHP app ([backend](backend/))
- Frontend: React + Vite + TypeScript ([frontend](frontend/))
- Mobile: React Native / Expo ([mobile](mobile/))
- Database migrations and seeders live in `backend/database`

**Quickstart — Backend**
1. Copy environment and install dependencies:

```bash
cd backend
cp .env.example .env
composer install
npm install
```

2. Set up the application key, database, and run migrations:

```bash
php artisan key:generate
php artisan migrate --seed
```

3. Run the backend server (local):

```bash
php artisan serve
# or, if using Valet/Homestead, follow your environment steps
```

4. Run frontend assets build/watch for the backend admin or Blade assets:

```bash
cd backend
npm run dev
```

**Quickstart — Frontend (Web)**

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173 (or the URL printed by Vite)
```

**Quickstart — Mobile**

```bash
cd mobile
npm install
# If using Expo:
expo start
```

**Testing**
- Backend tests: from `backend` run `php artisan test` or `vendor/bin/phpunit`
- Frontend: run `npm test` inside `frontend` (if tests are configured)

**Environment & Configuration**
- Store sensitive credentials in `.env` files and do not commit them.
- Configure `backend/config/database.php` and payment gateways in `backend/config/payments.php`.

**Deployment**
- Build frontend assets (`npm run build`) and deploy to a static host or CDN.
- Deploy Laravel backend to your PHP host (Forge, Vapor, or your own server). Ensure queue workers and schedulers are configured.

**Contributing**
- Open issues or PRs for bug fixes and features.
- Follow PSR-12 for PHP and project linting rules for JS/TS.

**License**
This project is provided under the MIT License unless otherwise specified.

**Contact**
For questions, reach out to the maintainer in the repository or open an issue.
