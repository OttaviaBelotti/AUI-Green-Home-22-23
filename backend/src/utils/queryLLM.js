const { Configuration, OpenAIApi } = require("openai");

class queryLLM{
    constructor(model) {
        this.name = 'queryLLM';
        this.api_key = process.env.API_KEY;
        this.model = model;
    }

    async run(input) {
        const configuration = new Configuration({
            apiKey: this.api_key,
        });
        const openai = new OpenAIApi(configuration);

        if (this.model === 'chatgpt') {
            console.log('using chatgpt');
            const response = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [
                    {"role": "user", "content": input}
                ]
            }).catch();
            console.log(response.data.choices[0].message.content)
            return response.data.choices[0].message.content;
        } else if (this.model === 'gpt'){
            console.log('using gpt');
            const response = await openai.createCompletion({
                model: "text-ada-001",
                prompt: input,
                max_tokens: 1024,
                temperature: 0.7,
            }).catch();
            console.log(response.data.choices[0].text)
            return response.data.choices[0].text;
        }

    }
}

module.exports = {queryLLM};