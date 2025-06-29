#!/bin/bash

echo "🚀 Setting up SaaS Chatbot Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Backend setup
echo "📦 Setting up backend..."
cd backend

if [ ! -f "package.json" ]; then
    echo "❌ Backend package.json not found. Please check the project structure."
    exit 1
fi

npm install

if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please update the .env file with your configuration before running the application."
else
    echo "✅ .env file already exists"
fi

cd ..

# Frontend setup
echo "📦 Setting up frontend..."
cd frontend

if [ ! -f "package.json" ]; then
    echo "❌ Frontend package.json not found. Please check the project structure."
    exit 1
fi

npm install

if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file from template..."
    cp env.example .env.local
    echo "⚠️  Please update the .env.local file with your configuration before running the application."
else
    echo "✅ .env.local file already exists"
fi

cd ..

echo ""
echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Set up PostgreSQL database and run database/schema.sql"
echo "2. Update backend/.env with your configuration"
echo "3. Update frontend/.env.local with your configuration"
echo "4. Set up Stripe account and products"
echo "5. Set up n8n instance"
echo ""
echo "To run the application:"
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Backend will run on http://localhost:3000"
echo "Frontend will run on http://localhost:3001" 