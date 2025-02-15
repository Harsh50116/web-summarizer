// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
    if(details.reason == "install") {
        chomre.storage.local.set({
            summaryLength: 'medium',
            autoSummairzer: false,
            savedSummaries: []
        });
    }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if(changeInfo.status == 'complete' && tab.url) {
        updateExtensionStatus(tab);
    }
});


//Function to update extension status
async function updateExtensionStatus(tab) {
    const isCompatible = checkPageCompatiblity(tab.url);

    if(isCompatible) {
        chrome.action.setBadgeText({ tabId: tab.id, text: ""});
        chrome.action.setIcon({
            tabId: tab.id,
            path: {
                "10": "",
                "40": "",
                "128": "",
            }
        });
    } else {
        chrome.action.setBadgeText({ tabId: tab.id, text: "X" });
        chrome.action.setBadgeBackgroundColor({tabId: tab.id, color: "#99999"});
    }
}


// Function to check if page is compatiable for summarization
function checkPageCompatiblity(url) {
    const incompatibleProtocols = ['chrome:', 'chrome-extension:', 'about:', 'data:'];

    try {
        const urlObj = new URL(url);
        return !incompatibleProtocols.includes(urlObj.protocol);
    } catch(e) {
        return false;
    }
}


// Optimal: Cache management
chrome.storage.onChanged.addListener((changes, namespace) => {
    if(namespace == 'local' && changes.savedSummaries) {
        if(changes.savedSummaries.newValue.length > 20) {
            chrome.storage.local.set({
                savedSummaries: changes.savedSummaries.newValue.slice(-20)
            });
        }
    }
});


// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSummaryHistory') {
        chrome.storage.local.get('savedSummaries', (data) => {
            const summaries = data.savedSummaries || [];
            const currentDomain = new URL(sender.tab.url).hostname;
            const domainSummaries = summaries.filter(s => 
                s.domain === currentDomain
            );
            sendResponse({ summaries: domainSummaries });
        });
        return true; 
    }
});
