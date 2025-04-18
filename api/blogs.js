const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const fetch = require('node-fetch');

const execPromise = util.promisify(exec);

const app = express();
app.use(express.json());

const BLOGS_FILE = path.join(__dirname, '../data/blogs.json');
const VERCEL_TOKEN = process.env.VERCEL_TOKEN; // Set in Vercel dashboard
const REPO_SLUG = process.env.REPO_SLUG; // e.g., 'technologia'
const TEAM_ID = process.env.TEAM_ID; // Vercel team ID

// Ensure blogs.json exists
async function initializeFile() {
    try {
        await fs.access(BLOGS_FILE);
    } catch {
        await fs.writeFile(BLOGS_FILE, JSON.stringify([]));
    }
}

initializeFile();

// Commit changes to Git and deploy
async function commitAndDeploy() {
    try {
        await execPromise('git add data/blogs.json');
        await execPromise('git commit -m "Update blogs.json"');
        await execPromise('git push origin main');

        // Trigger Vercel deployment via API
        const response = await fetch(`https://api.vercel.com/v13/deployments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: REPO_SLUG,
                gitSource: {
                    type: 'github',
                    repo: REPO_SLUG,
                    ref: 'main'
                },
                teamId: TEAM_ID
            })
        });

        if (!response.ok) {
            throw new Error('Failed to trigger deployment');
        }
    } catch (error) {
        console.error('Error committing and deploying:', error);
        throw error;
    }
}

// GET all blogs
app.get('/api/blogs', async (req, res) => {
    try {
        const data = await fs.readFile(BLOGS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading blogs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST a new blog
app.post('/api/blogs', async (req, res) => {
    try {
        const newBlog = req.body;
        const data = await fs.readFile(BLOGS_FILE, 'utf8');
        const blogs = JSON.parse(data);
        blogs.push(newBlog);
        await fs.writeFile(BLOGS_FILE, JSON.stringify(blogs, null, 2));
        await commitAndDeploy();
        res.status(201).json(newBlog);
    } catch (error) {
        console.error('Error writing blog:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = app;