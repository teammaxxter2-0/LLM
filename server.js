const express = require('express');
const json = require('body-parser').json;
const {OpenAiManager} = require('./assistant.js');
require('dotenv').config();

const app = express();
const port = 3000;
const manager = new OpenAiManager();

app.use(json());

app.post('/chat', async (req, res) => {
    try {
        const { data } = req.body;
        const thread = await manager.startThread();
        manager.createMessage(thread, data).then(r => {
            const response = r.data[0];
            const responseValue = response.content[0].text.value;
            res.json({ message: responseValue, threadId: thread });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/chat/:id', async (req, res) => {
    try {
        const { data } = req.body;
        const threadId = req.params.id;
        manager.createMessage(threadId, data).then(r => {
            const response = r.data[0];
            const responseValue = response.content[0].text.value;
            res.json({ message: responseValue });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
