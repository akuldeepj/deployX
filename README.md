# DeployX - Vercel Clone Project(React only)

A full-stack application that replicates core Vercel deployment functionality, allowing users to deploy web applications directly from GitHub repositories.

## 🚀 Features

- GitHub repository deployment
- Real-time deployment logs
- Automatic builds and deployments
- User authentication
- Deployment management (deploy, redeploy, delete)
- S3-based static file hosting
- Custom domain support for deployments

## 🏗️ Architecture

The project consists of four main components:

1. **Upload Service** (`/Upload`)
   - Handles initial file uploads and deployment requests
   - Manages user authentication and deployment metadata
   - Integrates with MongoDB for data persistence

2. **Deploy Service** (`/Deploy`)
   - Processes build queue
   - Builds projects from source
   - Manages deployment status and logs

3. **Request Handler** (`/Request`)
   - Serves deployed applications
   - Handles static file delivery from S3

4. **Frontend** (`/frontend`)
   - Next.js based dashboard
   - Deployment management interface
   - Real-time deployment status and logs

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: Next.js, React, TailwindCSS
- **Database**: MongoDB, Redis
- **Storage**: AWS S3
- **Authentication**: JWT, Cookies
- **Build System**: Custom build pipeline

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Redis
- AWS Account with S3 access
- Git

### Installing Redis

#### On Mac:
```bash
# Using Homebrew
brew install redis
# Start Redis
brew services start redis
```

#### On Linux (Ubuntu/Debian):
```bash
# Update package list
sudo apt update
# Install Redis
sudo apt install redis-server
# Start Redis
sudo systemctl start redis-server
# Enable Redis on startup
sudo systemctl enable redis-server
```

To verify Redis installation:
```bash
redis-cli ping
# Should return "PONG"
```

## 🚦 Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/vercel-clone.git
cd vercel-clone
```

2. Install dependencies for all services:
```bash
# Install Upload service dependencies
cd Upload && npm install

# Install Deploy service dependencies
cd ../Deploy && npm install

# Install Request service dependencies
cd ../Request && npm install

# Install Frontend dependencies
cd ../frontend && npm install
```

3. Configure environment variables:
Create `.env` files in each service directory with the following variables:
```env
# Common variables
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=your_bucket_name
AWS_REGION=your_region

# Upload service specific
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3002
DEPLOYMENT_DOMAIN=your_deployment_domain

# Frontend specific
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. Start the services:
```bash
# Start Upload service
cd Upload && npm run dev

# Start Deploy service
cd ../Deploy && npm run dev

# Start Request service
cd ../Request && npm run dev

# Start Frontend
cd ../frontend && npm run dev
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
