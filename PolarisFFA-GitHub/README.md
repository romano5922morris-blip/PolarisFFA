# PolarisFFA — Minecraft FFA Server Website

A complete, production-ready full-stack website for the PolarisFFA Minecraft FFA server.

## Features

- **Modern Tech Stack**: Next.js 14, TypeScript, Tailwind CSS, Prisma ORM
- **Authentication**: Secure NextAuth.js with credentials provider, email verification, password reset
- **Payments**: Stripe integration with secure checkout and webhook handling
- **Admin Dashboard**: Role-based access control (Helper → Admin → Head Admin → Co-Owner → Owner)
- **Server Status**: Live Minecraft server status via mcsrvstat.us API
- **Store**: Configurable products, ranks, cart, and checkout
- **Support Tickets**: Category-based ticket system with staff responses
- **Responsive Design**: Mobile-first, dark theme with Polaris/arctic aesthetic

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Stripe account (for payments)
- Resend account (for emails) or any SMTP provider

### Installation

```bash
# Clone and install dependencies
cd PolarisFFA
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run db:generate
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_URL` | Your site URL (e.g., https://polarisffa.eu) | Yes |
| `NEXTAUTH_SECRET` | Random 32+ character secret | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_test_...) | Yes |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (pk_test_...) | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret (whsec_...) | Yes |
| `RESEND_API_KEY` | Resend API key for emails | Yes |
| `EMAIL_FROM` | Sender email address | Yes |
| `MINECRAFT_SERVER_IP` | Server IP for status checks | Yes |
| `MINECRAFT_SERVER_PORT` | Server port (default: 25565) | No |
| `INITIAL_OWNER_EMAIL` | Owner account email | Yes |
| `INITIAL_OWNER_PASSWORD` | Owner account password (set at first run) | Yes |
| `INITIAL_OWNER_MINECRAFT_USERNAME` | Owner's Minecraft username | Yes |

### Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Create a webhook endpoint pointing to `/api/webhooks/stripe`
4. Subscribe to `checkout.session.completed` and `checkout.session.expired` events
5. Copy the webhook signing secret

### Email Setup (Resend)

1. Create a Resend account at https://resend.com
2. Verify your domain
3. Create an API key
4. Add the API key to `RESEND_API_KEY`

### Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Or run migrations (production)
npm run db:migrate

# Seed initial data
npm run db:seed
```

### Production Deployment

1. Build the application:
```bash
npm run build
```

2. Run database migrations:
```bash
npm run db:migrate
```

3. Start the production server:
```bash
npm start
```

### Docker Deployment (Optional)

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── admin/             # Admin dashboard
│   ├── dashboard/         # User dashboard
│   ├── store/             # Store page
│   ├── server/            # Server info page
│   └── ...
├── components/
│   ├── ui/                # Reusable UI components (Radix + Tailwind)
│   ├── home/              # Home page sections
│   ├── server/            # Server page components
│   └── ...
├── lib/                   # Core utilities
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   ├── stripe.ts         # Stripe helpers
│   ├── email.ts          # Email templates
│   └── server-status.ts  # Minecraft server status
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript types
```

## Role Hierarchy

1. **USER** - Default registered user
2. **HELPER** - Support ticket access
3. **ADMIN** - User management, product management
4. **HEAD_ADMIN** - Advanced administration
5. **CO_OWNER** - Near-full access
6. **OWNER** - Full access, can manage all roles

Permissions are enforced server-side. Never trust client-side role checks.

## Security Features

- Password hashing with bcrypt (12 rounds)
- Secure HTTP-only cookies for sessions
- CSRF protection via NextAuth
- Rate limiting on auth endpoints
- Input validation with Zod
- SQL injection protection via Prisma
- XSS protection via React's built-in escaping
- Server-side authorization checks
- Webhook signature verification for Stripe
- No sensitive data in client-side code

## Customization

### Theme Colors

Edit `tailwind.config.js` to customize the Polaris color palette:
- Primary: `polaris-500` (#0ea5e9)
- Background: `polaris-950` (#020617)
- Cards: `polaris-900/50` with backdrop blur

### Products

Products are managed through the admin panel or database. Each product has:
- Name, description, price (in cents)
- Type (rank, cosmetic, bundle, etc.)
- Active/featured flags
- Metadata for benefits, colors, etc.

### Server Information

Update `src/components/server/ServerInfo.tsx` and related components for:
- Server IP/port
- Supported versions
- Gameplay features
- Community links

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new account
- `POST /api/auth/verify-email` - Verify email token
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Store
- `GET /api/products` - List active products
- `POST /api/checkout` - Create Stripe checkout session
- `POST /api/webhooks/stripe` - Stripe webhook handler

### User
- `GET /api/user/purchases` - User's purchased ranks
- `GET /api/user/orders` - User's order history

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - List all users
- `GET/POST /api/admin/products` - Manage products
- `PATCH/DELETE /api/admin/products/[id]` - Update/delete product
- `GET /api/admin/orders` - List all orders

### Support
- `GET/POST /api/tickets` - List/create tickets
- `POST /api/tickets/[id]/messages` - Add message to ticket

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting: `npm run lint`
5. Run type checking: `npm run build`
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- Discord: https://discord.gg/HutBfhABcJ
- Email: romano5922morris@gmail.com
- YouTube: https://www.youtube.com/@PolarisFFA

---

Built with ❄️ for the PolarisFFA community