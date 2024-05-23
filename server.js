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
        const {data} = req.body;
        const threadId = await manager.startThread()
        await manager.createMessage(threadId, data);
        await sendMessageAndReceiveJSON(threadId, data).then((responseValue) => {
            res.json({message: responseValue, threadId: threadId});
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

app.post('/chat/:id', async (req, res) => {
    try {
        const {data} = req.body;
        const threadId = req.params.id;
        await manager.getThread(threadId).then(async (response) => {
            if (response.error) {
                await manager.startThread().then(async threadId => {
                    await sendMessageAndReceiveJSON(threadId, data).then((responseValue) => {
                        res.json({message: responseValue, threadId: threadId});
                    });
                });
            } else {
                await sendMessageAndReceiveJSON(threadId, data).then((responseValue) => {
                    res.json({message: responseValue});
                });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

async function sendMessageAndReceiveJSON(threadId, message) {
    await manager.createMessage(threadId, message);
    await manager.runThread(threadId).then(async r => {
        if (r.status === 'completed') {
            await manager.listMessages(threadId).then(r => {
                const response = r.data[0];
                return response.content[0].text.value;
            });
        } else {
            console.log(r.status)
        }
    });
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
