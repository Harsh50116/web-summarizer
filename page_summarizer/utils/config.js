const CONFIG = {
    API_KEY: 'test',
    API_URL: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent',
    SUMMARY_PROMPT: `Please provide a concise summary of the following text in this format:

Summary:
[2-3 sentence overview of the main topic]

Key Points:
• [Point 1]
• [Point 2]
• [Point 3]
...

Important Details:
• [Detail 1]
• [Detail 2]
• [Detail 3]
...

Text to summarize: `
}

export default CONFIG; 