class queryLLM{
    constructor() {
        this.name = 'queryLLM';
        this.api_key = process.env.API_KEY;
    }

    async run(input){
        const { Configuration, OpenAIApi } = require("openai");
        const configuration = new Configuration({
            apiKey: this.api_key,
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