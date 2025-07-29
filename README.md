# Repo Auto-Setup Verifier

A full-stack application that automatically verifies GitHub repository setup instructions by cloning repositories, extracting setup commands using AI, and executing them in sandboxed Docker containers.

## Features

- **Bulk Repository Processing**: Submit up to 10 GitHub repositories per batch
- **Multiple Input Methods**: Textarea input or CSV file upload
- **AI-Powered Setup Extraction**: Uses Gemini API to extract setup instructions from README files
- **Sandboxed Execution**: Runs setup commands in isolated Docker containers
- **Real-time Monitoring**: Live status updates and detailed job logs
- **Modern UI**: React frontend with Tailwind CSS
- **Queue-based Processing**: BullMQ with Redis for reliable job processing
- **Comprehensive Testing**: Jest tests for backend, React Testing Library for frontend

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Node.js API    │    │   PostgreSQL    │
│   (Port 3000)   │◄──►│   (Port 3001)   │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Redis Queue   │
                       │   (BullMQ)      │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Docker Jobs    │
                       │  (Sandboxed)    │
                       └─────────────────┘
```

## Tech Stack

### Backend
- **Node.js** with Express
- **PostgreSQL** for data persistence
- **Redis** with BullMQ for job queuing
- **Docker** for sandboxed execution
- **Gemini API** for AI-powered setup extraction
- **Sentry** for error monitoring
- **Jest** for testing

### Frontend
- **React** with React Router
- **React Query** for data fetching
- **Tailwind CSS** for styling
- **React Hook Form** for form handling
- **React Dropzone** for file uploads
- **Lucide React** for icons
- **React Testing Library** for testing

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd repo-verifier
```

### 2. Environment Setup
```bash
# Copy environment example
cp backend/env.example backend/.env

# Edit the environment file with your settings
# For MVP, you can use the default stub values
```

### 3. Start with Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Development Setup

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

### Database Setup
```bash
# PostgreSQL should be running via Docker Compose
# The application will automatically create tables on startup
```

## API Endpoints

### Submissions
- `POST /api/submissions` - Submit repository URLs
- `POST /api/submissions/upload` - Upload CSV file
- `GET /api/submissions/:id` - Get submission details

### Jobs
- `GET /api/jobs` - List jobs with pagination
- `GET /api/jobs/:id` - Get job details
- `GET /api/jobs/:id/logs` - Get job logs
- `GET /api/jobs/stats/overview` - Get statistics

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=repo_verifier
DB_USER=postgres
DB_PASSWORD=password

# Redis
REDIS_URL=redis://localhost:6379

# API
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Gemini API (optional for MVP)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent

# Sentry (optional)
SENTRY_DSN=your-sentry-dsn
```

## Usage

### 1. Submit Repositories
- Navigate to the "Submit Repos" page
- Enter GitHub URLs (one per line) or upload a CSV file
- Maximum 10 repositories per batch

### 2. Monitor Progress
- View real-time status updates on the Dashboard
- Check detailed results in the Results table
- Click "View" to see detailed job logs

### 3. Review Results
- **Yes**: Setup commands executed successfully
- **No**: Setup failed with detailed reason
- **Pending/Processing**: Job is in queue or running

## Security Features

- **Sandboxed Execution**: All setup commands run in isolated Docker containers
- **Resource Limits**: Memory and CPU limits on containers
- **Network Isolation**: Containers run without network access
- **Timeout Protection**: 5-minute maximum execution time per job
- **Input Validation**: Strict GitHub URL validation

## Monitoring

- **Health Checks**: Built-in health check endpoints
- **Error Logging**: Sentry integration for error tracking
- **Job Monitoring**: Real-time job status and progress
- **Performance Metrics**: Execution time tracking

## Troubleshooting

### Common Issues

1. **Docker not running**
   ```bash
   # Ensure Docker is running
   docker --version
   docker-compose --version
   ```

2. **Port conflicts**
   ```bash
   # Check if ports are in use
   lsof -i :3000
   lsof -i :3001
   lsof -i :5432
   lsof -i :6379
   ```

3. **Database connection issues**
   ```bash
   # Check PostgreSQL logs
   docker-compose logs postgres
   ```

4. **Redis connection issues**
   ```bash
   # Check Redis logs
   docker-compose logs redis
   ```

### Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
docker-compose logs redis
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs
3. Create an issue with detailed information 