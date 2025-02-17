import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use('/home', express.static('public'));

// Route to serve index.html
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Helper functions
async function readTasks() {
    try {
        const data = await fs.readFile(path.join(__dirname, 'tasks.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function writeTasks(tasks) {
    await fs.writeFile(path.join(__dirname, 'tasks.json'), JSON.stringify(tasks, null, 2));
}

// Get all tasks
app.get('/get-tasks', async (req, res) => {
    try {
        const tasks = await readTasks();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read tasks' });
    }
});

// Create task
app.post('/post-tasks', async (req, res) => {
    try {
        if (!req.body || !req.body.title || !req.body.status) {
            return res.status(400).json({ error: 'Title and status are required' });
        }
        const tasks = await readTasks();
        const newTask = {
            id: Date.now().toString(),
            title: req.body.title,
            status: req.body.status
        };
        tasks.push(newTask);
        await writeTasks(tasks);
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Update task
app.put('/update-tasks', async (req, res) => {
    try {
        const { currentTitle, newTitle, newStatus } = req.body;
        if (!currentTitle || !newTitle || !newStatus) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const tasks = await readTasks();
        const taskIndex = tasks.findIndex(task => task.title === currentTitle);
        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Task not found' });
        }
        tasks[taskIndex].title = newTitle;
        tasks[taskIndex].status = newStatus;
        await writeTasks(tasks);
        res.json(tasks[taskIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete task
app.delete('/delete-tasks', async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        const tasks = await readTasks();
        const filteredTasks = tasks.filter(task => task.title !== title);
        if (tasks.length === filteredTasks.length) {
            return res.status(404).json({ error: 'Task not found' });
        }
        await writeTasks(filteredTasks);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));