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
            const summary = await generateSummary(pageContent);

            summaryContent.textContent = summary;
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


async function generateSummary(content) {
    const previewText = content.slice(0, 500);
    return `${previewText}...

    [Full text length: ${content.length} characters]`;
}