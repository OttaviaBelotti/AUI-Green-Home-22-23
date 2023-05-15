class queryLLM{
    constructor() {
        this.name = 'queryLLM';
    }

    async run(input){
        const { Configuration, OpenAIApi } = require("openai");
        const configuration = new Configuration({
            apiKey: "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",
        });
        const openai = new OpenAIApi(configuration);
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: input,
            max_tokens: 1024,
            temperature: 0.7,
        }).catch();
        console.log(response.data.choices[0].text)
        return response.data.choices[0].text;

    }
}

module.exports = {queryLLM};