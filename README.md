# Real Estate Platform
<img width="1918" height="941" alt="image" src="https://github.com/user-attachments/assets/7b1358f9-b357-4d51-9a77-cc09274f92b8" />
<img width="1918" height="940" alt="image" src="https://github.com/user-attachments/assets/21ba0440-34e3-435d-8f6f-cdd83834e903" />
<img width="1908" height="962" alt="image" src="https://github.com/user-attachments/assets/4d7a9fd4-2178-4f19-9ce1-059eb01eb3bd" />
<img width="1862" height="955" alt="image" src="https://github.com/user-attachments/assets/1dc232c0-1df4-47a4-ab88-08f78d34cb91" />
<img width="1918" height="865" alt="image" src="https://github.com/user-attachments/assets/309d5493-6a4e-4513-b522-5f9069f4bca6" />
<img width="1918" height="905" alt="image" src="https://github.com/user-attachments/assets/98d1b3f5-bfd0-4b4a-875b-8b5a2f921bef" />
<img width="1917" height="952" alt="image" src="https://github.com/user-attachments/assets/7e4df7d4-48cc-484c-8aef-3baf4c36432f" />

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
