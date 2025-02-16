import CONFIG from '../utils/config.js';


const GEM_API_KEY = CONFIG.API_KEY;
const GEM_API_URL = CONFIG.API_URL;


function convertMarkdownToHtml(markdown) {
    return markdown
        // Convert bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Convert italics
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Convert bullet points
        .replace(/^\* (.*)/gm, '<li>$1</li>')
        // Wrap lists in ul tags
        .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
        // Convert line breaks
        .replace(/\n/g, '<br>');
}

document.addEventListener('DOMContentLoaded', function() {
    const summarizeBtn = document.getElementById('summarizeBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const summaryContent = document.getElementById('summaryContent');

    summarizeBtn.addEventListener('click', async() => {
        loadingSpinner.classList.remove('hidden');
        summaryContent.classList.add('hidden');

        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

            const response = await chrome.scripting.executeScript({
                target: {tabId: tab.id},
                func: getPageContent
            });

            const pageContent = response[0].result;
            // const summary = await generateSummary(pageContent);

            const summary = await generateGeminiSummary(pageContent);

            summaryContent.innerHTML = convertMarkdownToHtml(summary);
        } catch(error) {
            summaryContent.textContent = 'Error generating summary: ' + error.message;
        } finally {
            loadingSpinner.classList.add('hidden');
            summaryContent.classList.remove('hidden');
        }
    });
});

function getPageContent() {
    const contentSelectors = [
        'article',
        '[role="main"]',
        '.main-content',
        '#main-content',
        'main',
        '.post-content',
        '.article-content'
    ];

    function cleanContent(text) {
        return text.replace(/\s+/g, ' ')        // Replace multiple spaces with single space
        .replace(/[^\w\s.,!?-]/g, '')           // Remove special characters
        .trim(); 
    }

    for(let selector of contentSelectors) {
        const element = document.querySelector(selector);
        if(element) {
            return cleanContent(element.textContent);
        }
    }

    const elementsToRemove = [
        'header',
        'footer',
        'nav',
        'aside',
        '.ads',
        '#ads',
        '.sidebar',
        '#sidebar'
    ];

    const bodyClone = document.body.cloneNode(true);

    elementsToRemove.forEach(selector => {
        const elements = bodyClone.querySelectorAll(selector);
        elements.forEach(el => el.remove());
    });

    return cleanContent(bodyClone.textContent);
}


// async function generateSummary(content) {
//     const sentences = content.match(/[^.!?]+[.!?]+/g) || [];

//     //Calculate sentences scoees based on word frequency
//     const wordFrequency = [];
//     sentences.forEach(sentences => {
//         const words = sentences.toLowerCase().match(/\b\w+\b/g) || [];
//         words.forEach(word => {
//             wordFrequency[word] = (wordFrequency[word] || 0) + 1;
//         });
//     });

//     //Score each sentence
//     const sentenceScores = sentences.map(sentence => {
//         const words = sentence.toLowerCase().match(/\b\w+\b/g) || [];
//         const score = words.reduce((sum, word) => sum + (wordFrequency[word] || 0), 0);
//         return { sentence, score: score / words.length};
//     });


//     //Select top sentences (about 30% of original content)
//     const numSentences = Math.max(3, Math.ceil(sentences.length * 0.3));
//     const topSentences = sentenceScores
//         .sort((a, b) => b.score - a.score)
//         .slice(0, numSentences)
//         .sort((a, b) => sentences.indexOf(a.sentence) -  sentences.indexOf(b.sentence))
//         .map(item => item.sentence);

//     const summary = topSentences.join(" ");

//     return `Summary:\n\n${summary}\n\n[Original length: ${content.length} characters | Summarized to: ${summary.length} characters]`; 
// }


async function generateGeminiSummary(content) {
    try {
        const prompt = `Please provide a conside summary of the follwoing text. Focus on the main points and key information: ${content}`;

        const response = await fetch(`${GEM_API_URL}?key=${GEM_API_KEY}`, {
           method: 'POST',
           headers: {
            'Content-Type': 'application/json',
           },
           body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
           })
        });

        if(!response.ok) {
            throw new Error('Failed to generate summary');
        }

        const data = await response.json();

        //Extract the generated text from Gemini's response
        const generatedText = data.candidates[0].content.parts[0].text;
        return generatedText;
    } catch(error) {
        console.error('Error calling Gemini API: ', error);
        throw error;
    }
}