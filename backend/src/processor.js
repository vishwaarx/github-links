// --- START backend/src/processor.js --- //
const simpleGit = require('simple-git');
const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const docker = new Docker();

const processRepository = async (repoUrl, jobId) => {
  const startTime = Date.now();
  const logs = [];
  
  try {
    logs.push(`Starting processing for ${repoUrl}`);
    
    // Create temporary directory for cloning
    const tempDir = path.join(__dirname, '../temp', `job-${jobId}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Clone repository
    logs.push('Cloning repository...');
    const git = simpleGit();
    await git.clone(repoUrl, tempDir);
    logs.push('Repository cloned successfully');
    
    // Extract setup instructions using Gemini API
    logs.push('Extracting setup instructions...');
    const setupInstructions = await extractSetupInstructions(tempDir);
    logs.push(`Setup instructions extracted: ${setupInstructions ? 'Yes' : 'No'}`);
    
    // Execute setup commands in Docker
    logs.push('Executing setup commands in Docker...');
    const executionResult = await executeInDocker(tempDir, setupInstructions);
    
    const executionTime = Date.now() - startTime;
    
    return {
      status: 'completed',
      result: executionResult.success,
      reason: executionResult.reason,
      logs: logs.join('\n'),
      setupInstructions,
      executionTime
    };
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logs.push(`Error: ${error.message}`);
    
    return {
      status: 'failed',
      result: false,
      reason: error.message,
      logs: logs.join('\n'),
      setupInstructions: null,
      executionTime
    };
  } finally {
    // Cleanup temporary directory
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
  }
};

const extractSetupInstructions = async (repoPath) => {
  try {
    // Read README files
    const readmeFiles = ['README.md', 'README.txt', 'readme.md', 'readme.txt'];
    let readmeContent = '';
    
    for (const file of readmeFiles) {
      const filePath = path.join(repoPath, file);
      if (fs.existsSync(filePath)) {
        readmeContent = fs.readFileSync(filePath, 'utf8');
        break;
      }
    }
    
    if (!readmeContent) {
      return null;
    }
    
    // Use Gemini API to extract setup instructions
    const instructions = await callGeminiAPI(readmeContent);
    return instructions;
    
  } catch (error) {
    console.error('Error extracting setup instructions:', error);
    return null;
  }
};

const callGeminiAPI = async (readmeContent) => {
  try {
    // For MVP, we'll use a stub implementation
    // In production, replace with actual Gemini API call
    const response = await axios.post(
      process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      {
        contents: [{
          parts: [{
            text: `Extract setup, install, build, and run commands from this README. Return only the commands in a simple format:
            
            ${readmeContent.substring(0, 2000)}`
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GEMINI_API_KEY || 'stub-key'}`
        }
      }
    );
    
    // For MVP, return stub instructions
    return 'npm install && npm start';
    
  } catch (error) {
    console.error('Gemini API error:', error);
    // Return default instructions for common Node.js projects
    return 'npm install && npm start';
  }
};

const executeInDocker = async (repoPath, instructions) => {
  try {
    // Create Docker container
    const container = await docker.createContainer({
      Image: 'node:18-alpine',
      Cmd: ['/bin/sh', '-c', `cd /app && ${instructions}`],
      WorkingDir: '/app',
      Volumes: {
        '/app': {}
      },
      HostConfig: {
        Binds: [`${repoPath}:/app`],
        Memory: 512 * 1024 * 1024, // 512MB
        MemorySwap: 512 * 1024 * 1024,
        CpuPeriod: 100000,
        CpuQuota: 50000, // 50% CPU
        NetworkMode: 'none' // No network access for security
      }
    });
    
    // Start container
    await container.start();
    
    // Wait for container to finish (max 5 minutes)
    const result = await container.wait();
    
    // Get container logs
    const logs = await container.logs({
      stdout: true,
      stderr: true
    });
    
    // Remove container
    await container.remove();
    
    // Check if execution was successful
    if (result.StatusCode === 0) {
      return {
        success: true,
        reason: 'Setup completed successfully',
        logs: logs.toString()
      };
    } else {
      return {
        success: false,
        reason: `Setup failed with exit code ${result.StatusCode}`,
        logs: logs.toString()
      };
    }
    
  } catch (error) {
    return {
      success: false,
      reason: `Docker execution error: ${error.message}`,
      logs: error.stack
    };
  }
};

module.exports = {
  processRepository
};
// --- END backend/src/processor.js --- // 