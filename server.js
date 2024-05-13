const express = require('express');
const json = require('body-parser').json;
const {OpenAiManager} = require('./chat.js');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(json());

app.post('/send', async (req, res) => {
    try {
        const { data } = req.body;
        const manager = new OpenAiManager();
        const response = await manager.chat(data);
        res.json({ message: response });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: './templates' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
