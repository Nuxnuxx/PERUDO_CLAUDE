# Pirate Perudo 🏴‍☠️

A pirate-themed multiplayer implementation of Perudo (Liar's Dice), a classic dice game of bluffing and deception.

## Game Overview

Perudo is an ancient dice game where players roll dice in secret and make bids on how many dice of a certain value are on the table. It's a game of bluffing, probability, and strategy.

### Key Features

- Real-time multiplayer gameplay
- Pirate-themed UI
- Full implementation of official Perudo rules including:
  - Wild aces (ones)
  - Palafico rounds
  - Calza (exact) calls

## Deployment Instructions with Coolify

Coolify is a self-hosted platform that makes it easy to deploy applications to your VPS. Here's how to deploy Pirate Perudo using Coolify:

### Prerequisites

1. A VPS with Coolify installed
2. SSH access to your VPS
3. A domain or subdomain pointing to your VPS (optional but recommended)

### Deployment Steps

#### 1. Clone the Repository

First, clone this repository to your local machine:

```bash
git clone <repo-url>
cd pirate-perudo
```

#### 2. Push to Your Own Git Repository

Create a new repository on GitHub, GitLab, or any Git provider supported by Coolify, and push the code:

```bash
git remote add origin https://github.com/your-username/pirate-perudo.git
git push -u origin main
```

#### 3. Deploy with Coolify

1. **Log in to your Coolify dashboard**

2. **Create a new project**
   - Click on "Create New" and select "Project"
   - Give your project a name (e.g., "PiratePerudo")

3. **Add the Docker Compose service**
   - Within your project, click "Create New Resource"
   - Select "Docker Compose" as the deployment type
   - Connect to your Git repository (GitHub, GitLab, etc.)
   - Select the repository containing the Pirate Perudo code

4. **Configure the deployment**
   - Coolify will detect the `docker-compose.yml` file
   - Configure the build branch (usually `main` or `master`)

5. **Set up your domains**
   - In the "Settings" tab for **both** services (frontend and backend):
     - Add your domain or use the Coolify-provided subdomain
     - For the frontend, use your main domain (e.g., `perudo.yourdomain.com`)
     - For the backend, use a subdomain (e.g., `perudo-api.yourdomain.com`)
   - Enable HTTPS for both services if using your own domains

6. **Configure environment variables**
   - In the frontend service settings, add an environment variable:
     - Name: `BACKEND_URL`
     - Value: The complete URL of your backend service (e.g., `https://perudo-api.yourdomain.com`)
   
7. **Deploy the application**
   - Click "Save" and then "Deploy"
   - Coolify will build the Docker images and run the containers
   - Deploy the backend first, then the frontend

8. **Verify the deployment**
   - Once deployment is complete, visit your frontend domain to see the game running
   - Check the browser console to verify the Socket.IO connection to the backend

9. **Troubleshooting**
   - If you encounter connection issues between frontend and backend:
     - Check if CORS is enabled on the backend
     - Verify the BACKEND_URL environment variable is correctly set
     - Make sure both services are up and running

### Manual Deployment to a VPS

If you prefer to deploy manually without Coolify, you can use the Docker Compose file directly on your VPS:

1. **Transfer the files to your VPS**:
   ```bash
   scp -r pirate-perudo user@your-server-ip:/path/to/deployment
   ```

2. **SSH into your VPS**:
   ```bash
   ssh user@your-server-ip
   ```

3. **Navigate to the deployment directory**:
   ```bash
   cd /path/to/deployment
   ```

4. **Build and run the Docker containers**:
   ```bash
   docker-compose up -d --build
   ```

5. **Set up a reverse proxy (Nginx or Traefik) if needed**

## Local Development

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd pirate-perudo
```

2. Install dependencies for both frontend and backend:
```bash
npm run install:all
```

### Running the Game

Start both frontend and backend servers with a single command:
```bash
npm run dev
```

This will launch:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## How to Play

1. One player creates a game and receives a game code
2. Other players join using the same game code
3. The host starts the game when all players have joined
4. Each player takes turns bidding or challenging

### Game Rules

- Each player starts with 5 dice
- Players roll their dice secretly each round
- Players take turns making bids (e.g., "four threes")
- Each new bid must be higher than the previous bid
- Aces (ones) are wild and count for any value
- Players can challenge a bid by calling "Dudo" (doubt)
- The loser of a challenge loses one die
- When a player is down to their last die, special "Palafico" rules apply for one round
- The last player with dice remaining wins

## Technologies Used

- **Frontend**: Vue.js, Socket.IO client
- **Backend**: Node.js, Express, Socket.IO

## Game Features

- Create and join game rooms
- Real-time dice rolling and bidding
- Special rule handling (Palafico, Calza)
- Player management and game state tracking

## License

This project is licensed under the ISC License.# PERUDO_CLAUDE
