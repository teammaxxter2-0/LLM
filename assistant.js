const OpenAI = require("openai");

class OpenAiManager {
    constructor(newAssistant=false) {
        this.myAssistant = null;

        const API_KEY = process.env.OPENAI_API_KEY;
        const ASSIST_ID = process.env.OPENAI_ASSISTANT_ID;
        if (!API_KEY) {
            console.error("No OPENAI_API_KEY");
            process.exit(1);
        }

        var fs = require('fs');
        this.instructions = fs.readFileSync('assistant.txt', 'utf8');
        this.threadInstructions = fs.readFileSync('thread.txt', 'utf8');

        try {
            this.client = new OpenAI(API_KEY);
            if (ASSIST_ID) {
                this.myAssistant = this.getAssistant(ASSIST_ID);
            } else {
                console.error("No Assistant");
                process.exit(1);
            }
        } catch (error) {
            console.error("Error:", error);
            throw error;
        }
    }

    async createAssistant() {
        return this.client.beta.assistants.create({
            instructions: this.instructions,
            name: "BlisAI Assistant",
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
        this.client.beta.threads.messages.create(threadId,
            {role: "user", content: message}
        );
        return await this.client.beta.threads.runs.createAndPoll(
            threadId,
            {
                assistant_id: (await this.myAssistant).id,
                instructions: this.threadInstructions
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