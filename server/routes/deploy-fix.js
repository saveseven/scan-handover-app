// server/routes/deploy-fix.js
// Refactored Railway deployment fixer (async, safer, configurable)
// Usage:
//   node server/routes/deploy-fix.js --run [--force]
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DeploymentFix {
  constructor(options = {}) {
    this.rootDir = process.cwd();
    this.serverDir = path.join(this.rootDir, 'server');
    this.clientDir = path.join(this.rootDir, 'client');
    this.force = !!options.force;

    // Centralized configuration
    this.nodeEngine = '>=18.0.0';
    this.sharedDependencies = {
      express: '^4.18.2',
      cors: '^2.8.5',
      multer: '^1.4.5',
      xlsx: '^0.18.5',
      uuid: '^9.0.0'
    };

    this.serverScripts = {
      start: 'node server/server.js',
      build: 'node server/build.js',
      dev: 'node server/server.js'
    };

    this.serverPkgScripts = {
      start: 'node server.js',
      build: 'node build.js',
      dev: 'nodemon server.js'
    };
  }

  // Public orchestration method
  async fixDeployment() {
    console.log('🚀 Starting Railway Deployment Fix...\n');
    try {
      await this.createRootPackageJson();
      await this.createRailwayJson();
      await this.createNixpacksConfig();
      await this.createRailwayIgnore();
      await this.fixServerPackageJson();
      await this.createServerJs();
      await this.createBuildJs();
      await this.createEnvFiles();
      await this.createDirectories();

      console.log('✅ All files created (or skipped if present).');
      console.log('\n📋 Next Steps:');
      console.log('1. git add .');
      console.log('2. git commit -m "Fix Railway deployment"');
      console.log('3. git push origin main');
      console.log('4. Railway will auto-deploy');
    } catch (err) {
      console.error('❌ Error during deployment fix:', err);
    }
  }

  // Helpers
  async exists(fullPath) {
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async ensureDir(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (err) {
      // mkdir may fail if concurrent, ignore if directory exists
      if (!(err && err.code === 'EEXIST')) throw err;
    }
  }

  // If file exists and force is false -> skip. If force true -> overwrite.
  async writeFileSafe(relPath, content, opts = {}) {
    const force = opts.force ?? this.force;
    const fullPath = path.isAbsolute(relPath) ? relPath : path.join(this.rootDir, relPath);
    const dir = path.dirname(fullPath);

    await this.ensureDir(dir);

    const already = await this.exists(fullPath);
    if (already && !force) {
      console.log(`ℹ️  Skipped (exists): ${path.relative(this.rootDir, fullPath)}`);
      return false;
    }

    try {
      await fs.writeFile(fullPath, content, 'utf8');
      console.log(`${already ? '🔁 Overwritten' : '✅ Created'}: ${path.relative(this.rootDir, fullPath)}`);
      return true;
    } catch (err) {
      console.error(`❌ Failed to write ${fullPath}:`, err.message);
      throw err;
    }
  }

  // Templates & creators
  async createRootPackageJson() {
    const content = {
      name: 'box-scanning-backend',
      version: '1.0.0',
      type: 'module',
      main: 'server/server.js',
      scripts: this.serverScripts,
      dependencies: this.sharedDependencies,
      engines: { node: this.nodeEngine }
    };
    await this.writeFileSafe('package.json', JSON.stringify(content, null, 2));
  }

  async createRailwayJson() {
    const content = {
      $schema: 'https://railway.app/railway.schema.json',
      build: { builder: 'NIXPACKS' },
      deploy: { startCommand: 'npm start', restartPolicyType: 'ON_FAILURE' }
    };
    await this.writeFileSafe('railway.json', JSON.stringify(content, null, 2));
  }

  async createNixpacksConfig() {
    const content = `[phases.setup]
cmds = ["npm install"]

[start]
cmd = "npm start"`;
    await this.writeFileSafe('nixpacks.toml', content);
  }

  async createRailwayIgnore() {
    const content = `client/
.gitignore
README.md
*.md
.DS_Store
node_modules/
.env.local
`;
    await this.writeFileSafe('.railwayignore', content);
  }

  async fixServerPackageJson() {
    const serverPkgPath = path.join(this.serverDir, 'package.json');
    const content = {
      name: 'box-scanning-server',
      version: '1.0.0',
      type: 'module',
      main: 'server.js',
      scripts: this.serverPkgScripts,
      dependencies: this.sharedDependencies,
      engines: { node: this.nodeEngine }
    };
    await this.writeFileSafe(serverPkgPath, JSON.stringify(content, null, 2));
  }

  async createServerJs() {
    const content = `import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

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

// Ensure uploads and data directories exist
async function ensureDirs() {
  const uploadsDir = path.join(__dirname, 'uploads');
  const dataDir = path.join(__dirname, 'data');
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(dataDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create directories:', err);
  }
}
ensureDirs();

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test API endpoint
app.get('/api/test', (_req, res) => {
  res.json({
    message: 'Box Scanning API is working!',
    version: '1.0.0'
  });
});

// Scan routes (placeholders)
app.post('/api/scans/scan', (req, res) => {
  res.json({
    success: true,
    message: 'Scan functionality will be implemented',
    boxId: req.body?.boxId
  });
});

app.get('/api/scans/history', (_req, res) => {
  res.json([]);
});

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling
app.use((err, _req, res, _next) => {
  console.error('Error:', err?.stack || err);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : (err?.message || String(err))
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
  console.log(\`📊 Environment: \${process.env.NODE_ENV || 'development'}\`);
  console.log(\`🌐 Health check: http://localhost:\${PORT}/health\`);
});`;
    const target = path.join(this.serverDir, 'server.js');
    await this.writeFileSafe(target, content);
  }

  async createBuildJs() {
    const content = `// Build script for Railway deployment
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔨 Running build script...');

async function run() {
  const dataDir = path.join(__dirname, 'data');
  const uploadsDir = path.join(__dirname, 'uploads');

  await fs.mkdir(dataDir, { recursive: true });
  console.log('✅ Ensured data directory');

  await fs.mkdir(uploadsDir, { recursive: true });
  console.log('✅ Ensured uploads directory');

  const sampleData = {
    scans: [],
    dispatch: [],
    pending: []
  };

  for (const [key, val] of Object.entries(sampleData)) {
    const filePath = path.join(dataDir, \`\${key}.json\`);
    try {
      await fs.access(filePath);
      // exists
    } catch {
      await fs.writeFile(filePath, JSON.stringify(val, null, 2), 'utf8');
      console.log(\`✅ Created \${key}.json\`);
    }
  }

  console.log('✅ Build completed successfully');
}

run().catch(err => {
  console.error('Build script failed:', err);
  process.exit(1);
});`;
    const target = path.join(this.serverDir, 'build.js');
    await this.writeFileSafe(target, content);
  }

  async createEnvFiles() {
    const serverEnv = `NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourusername.github.io
`;
    const clientEnv = `REACT_APP_API_URL=https://your-app-name.railway.app/api
REACT_APP_ENVIRONMENT=production
`;

    await this.writeFileSafe(path.join(this.serverDir, '.env'), serverEnv);
    await this.writeFileSafe(path.join(this.clientDir, '.env'), clientEnv);
  }

  async createDirectories() {
    const dirs = [
      path.join(this.rootDir, 'server', 'controllers'),
      path.join(this.rootDir, 'server', 'models'),
      path.join(this.rootDir, 'server', 'routes'),
      path.join(this.rootDir, 'server', 'middleware'),
      path.join(this.rootDir, 'server', 'uploads'),
      path.join(this.rootDir, 'server', 'data'),
      path.join(this.rootDir, 'client', 'src'),
      path.join(this.rootDir, 'client', 'public')
    ];

    for (const dir of dirs) {
      const exists = await this.exists(dir);
      if (!exists) {
        await this.ensureDir(dir);
        console.log(`✅ Created directory: ${path.relative(this.rootDir, dir)}`);
      } else {
        console.log(`ℹ️  Directory exists: ${path.relative(this.rootDir, dir)}`);
      }
    }
  }

  async createClientPackageJson() {
    const content = {
      name: 'box-scanning-frontend',
      version: '1.0.0',
      homepage: 'https://yourusername.github.io/scan-handover-app',
      type: 'module',
      scripts: {
        predeploy: 'npm run build',
        deploy: 'gh-pages -d build',
        start: 'react-scripts start',
        build: 'react-scripts build',
        test: 'react-scripts test'
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'react-scripts': '5.0.1',
        axios: '^1.4.0'
      },
      devDependencies: { 'gh-pages': '^5.0.0' }
    };

    await this.writeFileSafe(path.join(this.clientDir, 'package.json'), JSON.stringify(content, null, 2));
  }

  async generateDeploymentInstructions() {
    const instructions = `# 🚀 Railway Deployment Instructions

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
    await this.writeFileSafe('DEPLOYMENT_GUIDE.md', instructions);
  }
}

// CLI entry
async function runFromCli() {
  const args = process.argv.slice(2);
  const shouldRun = args.includes('--run');
  const force = args.includes('--force') || args.includes('-f');

  const fixer = new DeploymentFix({ force });

  if (shouldRun) {
    try {
      await fixer.fixDeployment();
      await fixer.createClientPackageJson();
      await fixer.generateDeploymentInstructions();
      console.log('\nDone.');
    } catch (err) {
      console.error('Failed:', err);
      process.exit(1);
    }
  } else {
    console.log(`
📋 Railway Deployment Fix Script

Usage:
  node ${path.relative(thisScriptDir(), process.argv[1])} --run [--force]

Options:
  --run      Execute creation of files
  --force    Overwrite existing files

This will create or update the following files (skips existing unless --force used):
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
`);
  }
}

function thisScriptDir() {
  // helper to compute script location for the usage message
  return path.dirname(process.argv[1]);
}

if (import.meta.url.endsWith(path.basename(process.argv[1]))) {
  // running as script
  runFromCli();
}
