const express = require('express');
const json = require('body-parser').json;
const { OpenAiManager } = require('./assistant.js');
require('dotenv').config();

const app = express();
const port = 3000;
const manager = new OpenAiManager();

app.use(json());

app.post('/chat', async (req, res) => {
    try {
        const { data } = req.body;
        const threadId = await manager.startThread();
        await manager.createMessage(threadId, data);
        const responseValue = await sendMessageAndReceiveJSON(threadId, data);
        res.json({
            message: responseValue,
            threadId: threadId
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
        const response = await manager.getThread(threadId);
        let responseValue;
        let newThreadId = threadId;
        if (response.error) {
            newThreadId = await manager.startThread();
            responseValue = await sendMessageAndReceiveJSON(newThreadId, data);
            if (responseValue["NeedsVerify"] === true) {
                const verifiedResponse = await manager.verify(data);
                const verified = verifiedResponse.data[0].content[0].text.value;
                res.json({ message: verified, threadId: newThreadId });
            } else {
                res.json({ message: responseValue, threadId: newThreadId });
            }
        } else {
            responseValue = await sendMessageAndReceiveJSON(threadId, data);
            res.json({ message: responseValue });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

async function sendMessageAndReceiveJSON(threadId, message) {
    await manager.createMessage(threadId, message);
    const runResponse = await manager.runThread(threadId);
    if (runResponse.status === 'completed') {
        const messages = await manager.listMessages(threadId);
        return messages.data[0].content[0].text.value;
    } else {
        console.log(runResponse.status);
        return 'Thread is not completed';
    }
}

app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
});
