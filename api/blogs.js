const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());

const BLOGS_FILE = path.join(__dirname, '../data/blogs.json');

// Ensure blogs.json exists
async function initializeFile() {
    try {
        await fs.access(BLOGS_FILE);
    } catch {
        await fs.writeFile(BLOGS_FILE, JSON.stringify([]));
    }
}

initializeFile();

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
        res.status(201).json(newBlog);
    } catch (error) {
        console.error('Error writing blog:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = app;