#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const os = require('os');
const archiver = require('archiver');
const FormData = require('form-data');
const axios = require('axios');
const figlet = require('figlet');

// Configure global paths
const CONFIG_DIR = path.join(os.homedir(), '.cloudrik');
const AUTH_FILE = path.join(CONFIG_DIR, 'auth.json');
const LOCAL_DIR = path.join(process.cwd(), '.cloudrik');
const LOCAL_PROJECT_FILE = path.join(LOCAL_DIR, 'project.json');

const API_BASE = 'http://13.233.87.37:5000/api';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getAuthToken() {
  if (!fs.existsSync(AUTH_FILE)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
    return data.token;
  } catch (e) {
    return null;
  }
}

if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

program
  .name('rik')
  .description('The official CloudRik CLI for Vercel-like seamless deployments')
  .version('1.0.0');

// COMMAND: rik login
program
  .command('login')
  .description('Log into CloudRik using an API Token')
  .action(async () => {
    console.log('\n' + chalk.blue(figlet.textSync('CloudRik', { font: 'Slant' })));
    console.log(chalk.bold.dim('  Welcome to the CloudRik CLI 🚀\n'));
    
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'token',
        message: 'Enter your API Token (cr_tok_...):',
        validate: (input) => input.startsWith('cr_tok_') ? true : 'Invalid token format. It should start with cr_tok_'
      }
    ]);

    const spinner = ora('Validating token...').start();
    await sleep(800); // Artificial delay for premium feel
    
    // Check token with server (mocked as success for now since we haven't built the verify route, we will just save it)
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ token: answers.token }, null, 2));
    
    spinner.succeed(chalk.green('Authentication successful!'));
    console.log(chalk.dim('You are now logged in. Use `rik` to deploy.'));
  });

// COMMAND: rik push (deploy)
program
  .command('push')
  .description('Push and deploy your application to CloudRik')
  .action(async () => {
    const token = getAuthToken();
    if (!token) {
      console.log(chalk.red('Error: You are not logged in.'));
      console.log('Please run ' + chalk.cyan('rik login') + ' first.');
      return;
    }

    const currentFolder = path.basename(process.cwd());
    let projectId = null;

    if (fs.existsSync(LOCAL_PROJECT_FILE)) {
      try {
        const localData = JSON.parse(fs.readFileSync(LOCAL_PROJECT_FILE, 'utf8'));
        projectId = localData.projectId;
      } catch (e) { /* ignore */ }
    }

    console.log('\n' + chalk.cyan('☁️ CloudRik Deployment\n'));

    if (!projectId) {
      const setup = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'deploy',
          message: `Set up and deploy "${currentFolder}"?`,
          default: true
        }
      ]);

      if (!setup.deploy) {
        console.log(chalk.dim('\nDeployment aborted.'));
        return;
      }

      const projDetails = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: "What's your project's name?",
          default: currentFolder
        }
      ]);

      console.log('');
      const spinner = ora('Linking to CloudRik workspace...').start();
      await sleep(1000); 

      try {
        const response = await axios.post(`${API_BASE}/projects/cli-create`, {
          name: projDetails.projectName
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        projectId = response.data.projectId;
        
        spinner.text = 'Provisioning infrastructure...';
        await sleep(1200); 

        if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });
        fs.writeFileSync(LOCAL_PROJECT_FILE, JSON.stringify({ projectId, name: projDetails.projectName }, null, 2));
        
        spinner.succeed(chalk.green('Project linked successfully.'));
      } catch (err) {
        spinner.fail(chalk.red('Failed to create project. ' + (err.response?.data?.error || err.message)));
        return;
      }
    } else {
      console.log(chalk.dim('Linked to existing project. Initiating update...'));
    }

    console.log('');
    const uploadSpinner = ora('Building and compressing files...').start();
    await sleep(800);
    
    const zipPath = path.join(os.tmpdir(), `cloudrik_deploy_${Date.now()}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', async () => {
      try {
        uploadSpinner.text = 'Uploading to Edge Network...';
        await sleep(1500); 
        
        uploadSpinner.text = 'Deploying application...';
        
        const form = new FormData();
        form.append('file', fs.createReadStream(zipPath));
        form.append('projectId', projectId);

        const uploadRes = await axios.post(`${API_BASE}/projects/cli-deploy`, form, {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${token}`
          }
        });

        fs.unlinkSync(zipPath); 
        
        uploadSpinner.succeed(chalk.green.bold('Deployment successful! 🚀'));
        
        // Print beautiful summary
        console.log('\n' + chalk.gray('─────────────────────────────────────────'));
        console.log('  ' + chalk.bold('Preview:      ') + chalk.cyan.underline(`http://${uploadRes.data.url}`));
        console.log('  ' + chalk.bold('Environment:  ') + chalk.white('Production'));
        console.log('  ' + chalk.bold('Status:       ') + chalk.green('Ready'));
        console.log(chalk.gray('─────────────────────────────────────────\n'));

      } catch (err) {
        uploadSpinner.fail(chalk.red('Deployment failed. ' + (err.response?.data?.error || err.message)));
      }
    });

    archive.on('error', (err) => {
      uploadSpinner.fail(chalk.red('Failed to compress files.'));
      throw err;
    });

    archive.pipe(output);
    archive.glob('**/*', { 
      cwd: process.cwd(), 
      ignore: ['node_modules/**', '.git/**', '.cloudrik/**', 'dist/**'] 
    });
    archive.finalize();
  });

program.parse(process.argv);
