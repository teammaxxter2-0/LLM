const OpenAI = require("openai");
const fs = require('fs');

class OpenAiManager {
    constructor(newAssistant = false) {
        this.myAssistant = null;

        const API_KEY = process.env.OPENAI_API_KEY;
        const ASSIST_ID = process.env.OPENAI_ASSISTANT_ID;
        const VERIFY_ID = process.env.OPENAI_VERIFY_ID;
        if (!API_KEY) {
            console.error("No OPENAI_API_KEY");
            process.exit(1);
        }

        this.instructions = fs.readFileSync('./instructions/assistant.txt', 'utf8');
        this.threadInstructions = fs.readFileSync('./instructions/thread.txt', 'utf8');
        this.verifyInscructions = fs.readFileSync('./instructions/verify.txt', 'utf8');

        try {
            this.client = new OpenAI(API_KEY);
            if (ASSIST_ID) {
                this.myAssistant = this.getAssistant(ASSIST_ID);
            } else {
                console.error("No Assistant");
                process.exit(1);
            }

            if (VERIFY_ID) {
                this.verifyAI = this.getAssistant(VERIFY_ID);
            } else {
                console.error("No Assistant");
                process.exit(1);
            }
        } catch (error) {
            console.error("Error:", error);
            throw error;
        }
    }

    async createAssistants() {
        // WAARSCHUWING: Dit maakt de assistenten aan. Wees zeker dat je dit wilt aanroepen.
        // Als er al assistenten zijn worden die niet overschreven.
        const assistant = this.client.beta.assistants.create({
            instructions: this.instructions,
            name: "BlisAI Assistant",
            tools: [],
            model: "GPT-4o",
            temperature: 0.15,
            top_p: 1,
            response_format: {"type": "json_object"}
        });

        const verify = this.client.beta.assistants.create({
            instructions: this.verifyInscructions,
            name: "BlisAI Verify",
            tools: [],
            model: "GPT-4o",
            temperature: 0.15,
            top_p: 1,
            response_format: {"type": "json_object"}
        });
    }

    async listAssistants() {
        return this.client.beta.assistants.list({
            order: "desc",
            limit: "20",
        });
    }

    async getAssistant(assistantId) {
        return this.client.beta.assistants.retrieve(assistantId);
    }

    async deleteAssistant(assistantId) {
        return this.client.beta.assistants.del(assistantId);
    }

    async deleteAllAssistants() {
        const assistants = await this.listAssistants();
        for (const assistant of assistants.data) {
            await this.deleteAssistant(assistant.id);
        }
    }

    async startThread() {
        try {
            this.dbInfo = await (await fetch("http://localhost:5018/Options")).json()
            // this.dbInfo = fs.readFileSync('./instructions/DB.json', 'utf8');
            const newThread = await this.client.beta.threads.create();
            return newThread.id;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    async getThread(threadId) {
        return this.client.beta.threads.retrieve(threadId);
    }

    async deleteThreads(threadId) {
        return this.client.beta.threads.del(threadId);
    }

    async createMessage(threadId, message) {
        return this.client.beta.threads.messages.create(threadId,
            {role: "user", content: message}
        );
    }

    async verify(message) {
        let returnMessage = null;

        try {
            const threadId = await this.startThread();
            await this.createMessage(threadId, JSON.stringify(message));

            const response = await this.client.beta.threads.runs.createAndPoll(threadId, {
                assistant_id: (await this.verifyAI).id,
                instructions: `
                ${this.threadInstructions}
                Dit is onze Database, gebruik dit!
                Als iets niet klopt, pas aan!
                Als je iets aanpast qua meters, pas dan ook de totaal prijs aan.
                Als een boolean false is kan het niet geld kosten.
                ${JSON.stringify(this.dbInfo)}
            `
            });

            if (response.status === 'completed') {
                const messages = await this.listMessages(threadId);
                returnMessage = messages.data[0].content[0].text.value;
            } else {
                console.log(response.status);
            }
        } catch (error) {
            console.error("An error occurred:", error);
        }

        return returnMessage;
    }

    async runThread(threadId) {
        return this.client.beta.threads.runs.createAndPoll(
            threadId,
            {
                assistant_id: (await this.myAssistant).id,
                instructions: `
                ${this.threadInstructions}
                Dit is onze Database, gebruik dit!
                Geef een JSON object terug.
                ${JSON.stringify(this.dbInfo)}
            `
            }
        );
    }

    async listMessages(threadId) {
        return this.client.beta.threads.messages.list(threadId);
    }

    async getMessage(threadId, messageId) {
        return this.client.beta.threads.messages.retrieve(threadId, messageId);
    }

    async deleteMessage(threadId, messageId) {
        return this.client.beta.threads.messages.del(threadId, messageId);
    }

}

module.exports = {OpenAiManager};