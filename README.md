# DocuVocab

# Knowledge
1. Queries: GET
    - Located in /features/[featureName]
    - Fetch with the table.
2. Actions: POST / PATCH
    - Located in /features/[featureName]
    - CRUD the table.

# APP

1. User can select and take note about: DONE
2. when user hover a word, if that word was noted, it should show the meaning.
3. When user select a word, the word form should be filled with the word's note.
4. When no word is selected at the moment, we should hide the word form instead.
3. Each word card should be editable.

# Extension
1. Content script highlights saved words on CURRENT PAGE.
2. User selects word
3. Small floating buttons appear "Save word"
4. Extension calls your existing API.
5. Refresh highlights.

    # The flow
    1. Content script:
    - Javascript injected into the original website
    - Reads page text, highlights saved words, detects selected text

    2. Background server worker
    - Extension backend inside the browser
    - Handles API calls, auth token, messages between content script and popup

    3. Popup
    - Small UI when user clicks the extension icon.
    - Shows current page status, saved words, login state.

    4. side panel / floating widget
    - Optional UI on the page.
    - Better for saving/editing vocabulary while reading.

    Content script:
    - detects selected word
    - sends message to background
    - background calls your api
    - content script updates highlights

    Original page
        |
    content.ts
    (chrome.runtime.sendMessage(...))
        |
    background.ts
    (fetch(https://your-app/api/))
    Nextjs API
        |
    PostgreSQL

    Content.ts: 
    - Detect selected text
    - Find original sentence
    - show floating save button
    - inject highlight
    - show hover tooltip
    - observe page changes

    background.ts
    - store auth token
    - call your Next.js API
    - send results back to content script.

    popup.tsx
    - show login state
    - current page URL
    - Highlight toggle
    - open dashboard button

    # Technical methods
    1. Live DOM transformation: 
    - Get vocabularies from API
    - Build regex from saved words -> regex means: search pattern
        helps search page text to highlight the saved words inside the original page.
        example words: route | prefetching | server action
        -> pattern means: find route or prefetching or server action: /\b(prefetching|server action|route)\b/gi
    - Walk document.body text nodes with TReeWalker: go through every real text piece inside the webpage(DOM Tree)
        start at document.body
        visit each text node one by one
        check whether that text contains saved vocabulary
        Highlight it if allowed
        skip code/button/input/etc
        Advantage:
            - Don't rewrite the whole page.
            - will not destroy event handlers, buttons, inputs, state, app behavior.
            - Only touch small text nodes.
    - Skip PRE, CODE, A, BUTTON, INPUT, TEXTAREA, SCRIPT, STYLE.
    - Replace matching text pieces with <mark>
    - Add event listeners for hover tooltip.

    2. SPA pages: 
    context: When switching from one page to another page in the same domain/website, SPA pages will not reload the whole page -> Chrome do not reload the whole page -> content script may not automatically restart => Watch URL/Content changes.
    - MutationObserver:
        Why: URL changes - content still old for 100ms - new articles renders
            issue: extension highlights immediately, it may highlight old content or miss  the new article.
        How:
        - MutationObserver lets the extension notice:
            1. The DOM change
            2. Next text appeared
            3. Run highlight again.

    3. Auth plan
    


    # PHASE 1: DETECT SELECTED WORD ON ORIGINAL PAGE

    1. BE. supports: 
    - Extension user selects word + original URL to your API.
        -> API saves vocabulary + sourceUrl/sourceHostname/pageTitle
        -> extension can return saved words.
        -> extention highlights the save words.


    # PHASE 2: STORE SOURCE URL info
    - Add sourceUrl that user knows where the word comes from.

    # PHASE 3: HIGHLIGHT SAVE VOCAB ON ORIGINAL PAGES.

    # PHASE 4: Hover tooltip

    # PHASE 5: EXTENSION POPUP:
    - The pop up shows:
        Docuvocab
        Current page
        Saved words on this page
        Open dashboard
        Toggle highlists: on/off 




Issue:
1. Code block are not colored and showed number line

