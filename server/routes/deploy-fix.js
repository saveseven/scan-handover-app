// deploy-fix.js - Complete Railway Deployment Fix
// Run this file to fix all deployment issues

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class DeploymentFix {
  constructor() {
    this.rootDir = process.cwd();
    this.serverDir = path.join(this.rootDir, 'server');
    this.clientDir = path.join(this.rootDir, 'client');
  }

  // Create all necessary files for Railway deployment
  async fixDeployment() {
    console.log('🚀 Starting Railway Deployment Fix...\n');

    try {
      // 1. Create root package.json
      this.createRootPackageJson();
      
      // 2. Create railway.json
      this.createRailwayJson();
      
      // 3. Create nixpacks.toml
      this.createNixpacksConfig();
      
      // 4. Create .railwayignore
      this.createRailwayIgnore();
      
      // 5. Fix server package.json
      this.fixServerPackageJson();
      
      // 6. Create proper server.js
      this.createServerJs();
      
      // 7. Create build.js
      this.createBuildJs();
      
      // 8. Create environment files
      this.createEnvFiles();
      
      // 9. Create directory structure
      this.createDirectories();
      
      console.log('✅ All files created successfully!');
      console.log('\n📋 Next Steps:');
      console.log('1. git add .');
      console.log('2. git commit -m "Fix Railway deployment"');
      console.log('3. git push origin main');
      console.log('4. Railway will auto-deploy');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  createRootPackageJson() {
    const content = {
      name: "box-scanning-backend",
      version: "1.0.0",
      type: "module",
      main: "server/server.js",
      scripts: {
        start: "node server/server.js",
        build: "node server/build.js",
        dev: "node server/server.js"
      },
      dependencies: {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "multer": "^1.4.5",
        "xlsx": "^0.18.5",
        "uuid": "^9.0.0"
      },
      engines: {
        node: ">=18.0.0"
      }
    };

    this.writeFile('package.json', JSON.stringify(content, null, 2));
    console.log('✅ Created root package.json');
  }

  createRailwayJson() {
    const content = {
      "$schema": "https://railway.app/railway.schema.json",
      "build": {
        "builder": "NIXPACKS"
      },
      "deploy": {
        "startCommand": "npm start",
        "restartPolicyType": "ON_FAILURE"
      }
    };

    this.writeFile('railway.json', JSON.stringify(content, null, 2));
    console.log('✅ Created railway.json');
  }

  createNixpacksConfig() {
    const content = `[phases.setup]
cmds = ["npm install"]

[start]
cmd = "npm start"`;

    this.writeFile('nixpacks.toml', content);
    console.log('✅ Created nixpacks.toml');
  }

  createRailwayIgnore() {
    const content = `client/
.gitignore
README.md
*.md
.DS_Store
node_modules/
.env.local`;

    this.writeFile('.railwayignore', content);
    console.log('✅ Created .railwayignore');
  }

  fixServerPackageJson() {
    const serverPkgPath = path.join(this.serverDir, 'package.json');
    const content = {
      name: "box-scanning-server",
      version: "1.0.0",
      type: "module",
      main: "server.js",
      scripts: {
        start: "node server.js",
        build: "node build.js",
        dev: "nodemon server.js"
      },
      dependencies: {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "multer": "^1.4.5",
        "xlsx": "^0.18.5",
        "uuid": "^9.0.0"
      }
    };

    this.writeFile(serverPkgPath, JSON.stringify(content, null, 2));
    console.log('✅ Fixed server/package.json');
  }

  createServerJs() {
    const content = `import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure data directory exists  
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test API endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Box Scanning API is working!',
    version: '1.0.0'
  });
});

// Scan routes
app.post('/api/scans/scan', (req, res) => {
  // Mock scan endpoint
  res.json({
    success: true,
    message: 'Scan functionality will be implemented',
    boxId: req.body.boxId
  });
});

app.get('/api/scans/history', (req, res) => {
  // Mock history endpoint
  res.json([]);
});

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
  console.log(\`📊 Environment: \${process.env.NODE_ENV || 'development'}\`);
  console.log(\`🌐 Health check: http://localhost:\${PORT}/health\`);
});`;

    this.writeFile(path.join(this.serverDir, 'server.js'), content);
    console.log('✅ Created server/server.js');
  }

  createBuildJs() {
    const content = `// Build script for Railway deployment
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔨 Running build script...');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ Created data directory');
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// Create sample data files if they don't exist
const sampleData = {
  scans: [],
  dispatch: [],
  pending: []
};

Object.keys(sampleData).forEach(key => {
  const filePath = path.join(dataDir, \`\${key}.json\`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(sampleData[key], null, 2));
    console.log(\`✅ Created \${key}.json\`);
  }
});

console.log('✅ Build completed successfully');`;

    this.writeFile(path.join(this.serverDir, 'build.js'), content);
    console.log('✅ Created server/build.js');
  }

  createEnvFiles() {
    // Server .env
    const serverEnv = `NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourusername.github.io`;

    this.writeFile(path.join(this.serverDir, '.env'), serverEnv);
    console.log('✅ Created server/.env');

    // Client .env
    const clientEnv = `REACT_APP_API_URL=https://your-app-name.railway.app/api
REACT_APP_ENVIRONMENT=production`;

    this.writeFile(path.join(this.clientDir, '.env'), clientEnv);
    console.log('✅ Created client/.env');
  }

  createDirectories() {
    const dirs = [
      'server/controllers',
      'server/models', 
      'server/routes',
      'server/middleware',
      'server/uploads',
      'server/data',
      'client/src',
      'client/public'
    ];

    dirs.forEach(dir => {
      const fullPath = path.join(this.rootDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(\`✅ Created directory: \${dir}\`);
      }
    });
  }

  writeFile(filePath, content) {
    const fullPath = path.join(this.rootDir, filePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content, 'utf8');
  }

  // Create client package.json
  createClientPackageJson() {
    const content = {
      name: "box-scanning-frontend",
      version: "1.0.0",
      homepage: "https://yourusername.github.io/scan-handover-app",
      type: "module",
      scripts: {
        predeploy: "npm run build",
        deploy: "gh-pages -d build",
        start: "react-scripts start",
        build: "react-scripts build",
        test: "react-scripts test"
      },
      dependencies: {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-scripts": "5.0.1",
        "axios": "^1.4.0"
      },
      devDependencies: {
        "gh-pages": "^5.0.0"
      }
    };

    this.writeFile('client/package.json', JSON.stringify(content, null, 2));
    console.log('✅ Created client/package.json');
  }

  // Generate deployment instructions
  generateDeploymentInstructions() {
    const instructions = `
# 🚀 Railway Deployment Instructions

## Backend Deployment (Railway)
1. Push code to GitHub
2. Go to railway.app → New Project → Deploy from GitHub
3. Select your repository
4. Railway will auto-deploy

## Frontend Deployment (GitHub Pages)
\`\`\`bash
cd client
npm install
npm run build
npm run deploy
\`\`\`

## Environment Variables
### Railway Variables:
- NODE_ENV=production
- PORT=5000
- FRONTEND_URL=https://yourusername.github.io

### Client Variables:
- REACT_APP_API_URL=https://your-app.railway.app/api

## Test Deployment
1. Backend: https://your-app.railway.app/health
2. Frontend: https://yourusername.github.io/scan-handover-app

## Troubleshooting
- Check Railway logs for errors
- Verify environment variables
- Test API endpoints with curl/postman
    `;

    this.writeFile('DEPLOYMENT_GUIDE.md', instructions);
    console.log('✅ Created DEPLOYMENT_GUIDE.md');
  }
}

// Run the fix
const fixer = new DeploymentFix();

// Check if we should run
if (process.argv[2] === '--run') {
  fixer.fixDeployment().then(() => {
    fixer.createClientPackageJson();
    fixer.generateDeploymentInstructions();
  });
} else {
  console.log(`
📋 Railway Deployment Fix Script

Usage:
node deploy-fix.js --run

This will create all necessary files for Railway deployment.

Files that will be created:
✅ package.json (root)
✅ railway.json
✅ nixpacks.toml  
✅ .railwayignore
✅ server/package.json
✅ server/server.js
✅ server/build.js
✅ server/.env
✅ client/.env
✅ client/package.json
✅ DEPLOYMENT_GUIDE.md

Run with: node deploy-fix.js --run
  `);
}
