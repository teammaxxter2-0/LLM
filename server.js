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
                    await sendMessageAndReceiveJSON(threadId, data).then(async (responseValue) => {
                        if (responseValue["NeedsVerify"] === true) {
                            await manager.verify(data).then((responseValue) => {
                                const response = responseValue.data[0];
                                const verified = response.content[0].text.value;
                                res.json({message: verified, threadId: threadId});
                            });
                        } else {
                            res.json({message: responseValue, threadId: threadId});
                        }
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


const dummyData = {
    "name": "Noble Desiree Grey Matt",
    "aantal_m2": 5,
    "prijs_per_m2": 247.52,
    "prijs_m2_totaal": 1237.6,
    "randafwerking_m": 5,
    "randafwerking_prijs_per_m": 87,
    "randafwerking_hoogte_mm": 50,
    "randafwerking_prijs_totaal": 435,
    "spatrand_m": 3,
    "spatrand_prijs_per_m": 35,
    "spatrand_hoogte_mm": 100,
    "spatrand_prijs_totaal": 105,
    "vensterbank_m": 3,
    "vensterbank_prijs_per_m": 35,
    "vensterbank_breete_mm": 100,
    "vensterbank_prijs_totaal": 105,
    "spoelbak": true,
    "uitsparing_spoelbak": "ruw",
    "spoelbak_prijs": 70,
    "kraangat": true,
    "kraangat_prijs": 10.70,
    "zeepdispenser": true,
    "zeepdispenser_prijs": 10.70,
    "boorgaten": true,
    "boorgaten_stuk": 1,
    "bootgaten_mm": 5,
    "boorgaten_prijs_per_stuk": 5,
    "bootgaten_prijs_totaal": 5,
    "WCD": true,
    "WCD_prijs": 13.50,
    "achterwand": true,
    "acherwand_m2": 5,
    "achterwand_prijs_per_m2": 309.40,
    "achterwand_prijs_totaal": 1547,
    "offerte_prijs_totaal": 3761
}

async function verifyTest(data) {
    await manager.verify(data).then((responseValue) => {
        console.log({message: responseValue});
    });
}

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

app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
    await verifyTest(dummyData);
});
