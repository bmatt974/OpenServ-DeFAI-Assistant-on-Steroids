# DeFAI Assistant 🏋️ on Steroids

DeFAI Assistant is the ultimate Swiss Army knife powering https://KOLx.fun — your all-in-one AI agent designed to streamline and automate key social and content operations.

It seamlessly integrates with Twitter, Telegram, and external platforms, offering advanced scraping, posting, and content creation features, tailored specifically for the Web3 and DeFi ecosystem.

## Capabilities :

### 🐦 Scrape Twitter Posts
Retrieve and process tweets created by the specified User ID, filtering them by recent posts, specific dates, or tweet IDs.

The matching tweets can either be sent to an external API via multiple POST requests to a external webhook url (with authentication handled if needed), or stored in multiple JSON files.

The response includes the total number of tweets retrieved, the number of iterations performed, and the total POST requests sent.
Pagination is handled to ensure complete data processing.

**Prompt example with sent to an external API :**

```
Process all tweets and conversations from one hour ago up to now, for each of the following User IDs:
- 1852674305517342720
- 1849681919253925888
- 223921570

Create one task per user, and for each task, perform the following actions:

- Retrieve (scrape) the user's tweets and conversations within the specified time range.
- Immediately POST the scraped data to: https://example.com/api/v1/tweets using the Bearer token stored in the secret.
```

**Prompt example with result stored in multiple JSON files :**

```
Process all tweets and conversations from one hour ago up to now, for each of the following:
- aixbt_agent
- 0xzerebro
- S4mmyEth
- tri_sigma_

Create one task per user.
```

### 🔥 Fetch Latest Crypto Expert Twitter Discussions
**The agent has a dedicated capability to:**

- Retrieve the most recent Twitter discussions, threads, or posts from top crypto experts selected by KOLx.fun.
- Aggregate and structure these conversations in a clean JSON format.
- Organize conversations by author and store each author's conversations in a dedicated JSON file.
- Provide essential metadata for each conversation (e.g., timestamp, expert username, post content, engagement metrics).
- Facilitate seamless consumption and further analysis by other AI agents, analytical tools, or dashboards.

**This capability is ideal for:**

- Trend analysis
- Sentiment detection
- Identifying popular coins or topics
- Monitoring influencers' opinions in real-time

```
Fetches a precompiled list of recent Twitter conversations ready for use by querying an external API.
The retrieved conversations are grouped by author and saved into individual JSON files for further processing or usage.
Deliver this data to the Copywriter for article generation.
Do not process or write any article yourself. 
```

### 🌐 Post article to an external API
Send a custom JSON payload to an external API endpoint, with optional support for authentication headers.
Ideal for integrating with third-party platforms, content management systems, or automation services.

Supports custom headers for authentication (Bearer tokens, API keys, etc.).

```
Post an article to the https://wordpress.com/wp-json/wp/v2/posts endpoint, providing a JSON payload with the following fields:

- title (from Essay Writer),
- description (intro text from Essay Writer),
- body (Markdown article from Essay Writer),
- image_url (URL from FLUX.1-Schnell Image Generator).

Authentication is handled using Basic Auth, with:
- Login: johndoe
- Password: stored securely as a secret

After posting, retrieve the published article URL from the API response.
If no valid article is available, mark all related tasks as done.
```

### 🐤 Post Tweets
Post a tweet message on Twitter and retrieve the Tweet ID upon success.

```
Post message "Hello world" on Twitter
```

### 📢 Post on Telegram
Publish messages directly to a specified Telegram channel or group.
```
Post message "Hello world" on Telegram
```

## How to handle external API authentication ?

### Auth with apiKey
```
Post data to https://my-cms-website-example.com/api/posts with apiKey "X-API-Key" and value with "MY-CMS-WEBSITE_API_KEY" from secret.
```
### Auth with Token BEARER
```
Post data to https://jsonplaceholder.typicode.com/posts. Use Token BEARER from secret.
```  
### Auth with Username and Password
```  
Post data to https://example.com/posts with "john" username and password "MySecretLabel" from secret.
```
## 📝 Article Generation

Here is an example of an article generated based on the retrieved Twitter conversations:

```
DeFAI Assistant 🏋️ on Steroids:
Fetches a precompiled list of recent Twitter conversations ready for use by querying an external API.
The retrieved conversations are organized per author and saved into separate JSON files, one per author, containing all conversations they participated in.
For each JSON file, deliver the data to the Copywriter for article generation.
Do not process or write any article yourself.

Essay Writer:
For each expert conversations JSON file received, write a dedicated blog post focused solely on that specific expert.
Process each file individually and generate one article per file. Do not combine multiple experts into a single article.
For each article:
- Generate a unique, catchy title directly related to the content and key cryptos mentioned by the expert. Avoid generic titles like "Crypto Market Insights" or "A Dive into Recent Twitter Conversations".
- Whenever possible, include the most discussed crypto tickers or trending topics in the title. Ensure the title feels specific, engaging, and tailored to the actual discussion.
For the content:
- Summarize the expert's discussions by providing essential context and highlighting key points.
- Prioritize clarity, flow, and reader engagement.
- Start with a short, catchy introduction (2-3 sentences) to hook the reader.
- Structure the article using clear headings, bullet points, and short paragraphs. Avoid long text blocks.
- Bold all crypto tickers mentioned (e.g., $BTC, $ETH).
- Cite and reference all tweets mentioned in the discussion.
- Include a dedicated section listing all cryptocurrencies discussed.
- End the article with a short, impactful conclusion or key takeaway (2-3 lines).

FLUX.1-Schnell Image Generator:
For each article generated per expert, analyze the Markdown article and create a relevant illustrative image. The image should be in panoramic format matching Twitter dimensions (1200x675px), minimal text, strong visuals. Provide the image URL. Mark all tasks as done for an author if no article exists.

DeFAI Assistant 🏋️ on Steroids: (Article Publishing Task):
For each expert's article, post the article to the https://kolx.fun/api/v1/articles endpoint (use token bearer in secret) with JSON fields:
- title (from Essay Writer)
- description (intro text from Essay Writer)
- body (Markdown article from Essay Writer)
- image_url (URL from FLUX.1-Schnell Image Generator)
Retrieve the published article URL from the API response. Mark all tasks as done for an author if no valid article is available.

Copywriter:
For each published article, prepare a short, catchy message based on the article title (max 160 characters) summarizing the article. Include the published article URL.

DeFAI Assistant 🏋️ on Steroids: (Twitter Posting Task):
Post each message on Twitter. Mark all tasks as done for an author if no article URL is available.

DeFAI Assistant 🏋️ on Steroids: (Telegram Posting Task):
Post each message on Telegram. Mark all tasks as done for an author if no article URL is available.
```
