# SaaS Chatbot Platform

A complete SaaS platform for deploying AI-powered chatbots on websites. Built with Node.js, PostgreSQL, Next.js, and integrated with Stripe for payments and n8n for workflow automation.

## Features

- **Multi-tenant Architecture**: Each customer gets their own isolated chatbot instance
- **Stripe Integration**: Subscription management with Basic and Pro plans
- **n8n Workflow Automation**: Customizable chatbot workflows for each tenant
- **Embeddable Widget**: Easy-to-integrate chat widget for customer websites
- **Real-time Chat**: Live chat functionality with message logging
- **Dashboard**: Comprehensive dashboard for managing chatbots and viewing analytics
- **API Management**: Secure API key management for each tenant
- **Rate Limiting**: Built-in rate limiting and security features

## Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** for data storage
- **JWT** for authentication
- **Stripe** for payment processing
- **n8n** for workflow automation
- **bcryptjs** for password hashing
- **Helmet** for security headers
- **Rate limiting** for API protection

### Frontend
- **Next.js** 13 with React 18
- **Tailwind CSS** for styling
- **Axios** for API communication
- **Local storage** for token management

## Project Structure

```
├── database/
│   └── schema.sql              # Database schema
├── backend/
│   ├── package.json            # Backend dependencies
│   ├── server.js               # Main Express server
│   ├── middleware/
│   │   ├── auth.js             # Authentication middleware
│   │   └── validation.js       # Request validation
│   ├── n8nClient.js            # n8n API client
│   └── env.example             # Environment variables template
├── frontend/
│   ├── package.json            # Frontend dependencies
│   ├── pages/                  # Next.js pages
│   │   ├── _app.js
│   │   ├── index.js            # Landing page
│   │   ├── login.js            # Login page
│   │   ├── register.js         # Registration page
│   │   └── dashboard.js        # Dashboard
│   ├── lib/
│   │   ├── auth.js             # Authentication utilities
│   │   └── api.js              # API client
│   ├── styles/
│   │   └── globals.css         # Global styles
│   ├── public/
│   │   └── chat-widget.js      # Embeddable chat widget
│   └── env.example             # Frontend environment variables
└── README.md                   # This file
```

## Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+
- n8n instance (for workflow automation)
- Stripe account (for payments)

## Installation

### 1. Database Setup

```sql
-- Create database
CREATE DATABASE saas_chatbot;

-- Run the schema
\i database/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env with your configuration
```

Update the `.env` file with your configuration:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://user:pass@localhost:5432/saas_chatbot
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_BASIC=price_basic_monthly_id
STRIPE_PRICE_PRO=price_pro_monthly_id
N8N_URL=http://localhost:5678
N8N_API_KEY=your_n8n_api_key
N8N_TEMPLATE_WORKFLOW_ID=123
FRONTEND_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp env.example .env.local

# Edit .env.local with your configuration
```

Update the `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WIDGET_URL=http://localhost:3000
```

### 4. Stripe Setup

1. Create a Stripe account and get your API keys
2. Create two products in Stripe:
   - Basic plan ($29/month)
   - Pro plan ($99/month)
3. Note the price IDs and update your backend `.env` file
4. Set up webhook endpoint: `http://localhost:3000/webhook/stripe`

### 5. n8n Setup

1. Install and run n8n
2. Create a template workflow for chatbots
3. Get your n8n API key
4. Update the backend `.env` file with n8n configuration

## Running the Application

### Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Production

```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run build
npm start
```

## Usage

### 1. User Registration/Login

- Visit `http://localhost:3001`
- Register a new account or login
- Choose a subscription plan

### 2. Dashboard Features

- **Overview**: View current plan, message count, and status
- **Integration**: Get embed code for your website
- **Chat Logs**: View conversation history
- **Settings**: Manage account settings

### 3. Website Integration

Copy the embed code from the dashboard and add it to your website:

```html
<!-- ChatBot Widget -->
<script>
  window.ChatbotConfig = {
    apiKey: "your_api_key",
    webhookUrl: "http://localhost:3000/webhook/chat/your_tenant_id",
    theme: {
      primaryColor: "#3B82F6",
      position: "bottom-right"
    }
  };
</script>
<script src="http://localhost:3000/chat-widget.js"></script>
```

### 4. API Usage

The platform provides RESTful APIs for integration:

```bash
# Authentication
POST /auth/register
POST /auth/login

# Tenant Management
GET /tenant/profile
PATCH /tenant/settings
POST /tenant/regenerate-api-key

# Chat
POST /webhook/chat/:tenantId
GET /tenant/chat-logs

# Billing
POST /create-checkout
```

## Security Features

- JWT-based authentication
- API key authentication for webhooks
- Password hashing with bcrypt
- Rate limiting on all endpoints
- CORS protection
- Helmet security headers
- Input validation with Joi

## Deployment

### Environment Variables

Make sure to update all environment variables for production:

- Use strong JWT secrets
- Set up production database
- Configure production Stripe keys
- Set up production n8n instance
- Update CORS origins

### Database

- Use a production PostgreSQL instance
- Set up proper backups
- Configure connection pooling

### Frontend

- Build the Next.js application
- Serve static files from a CDN
- Configure proper caching headers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub. 