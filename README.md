# DeFAI Assistant 🏋️ on Steroids

DeFAI Assistant is the ultimate Swiss Army knife powering https://KOLx.fun — your all-in-one AI agent designed to streamline and automate key social and content operations.
It seamlessly integrates with Twitter, Telegram, and external platforms, offering advanced scraping, posting, and content creation features, tailored specifically for the Web3 and DeFi ecosystem.

## Capabilities :

### 🐦 Scrape Twitter Posts
Retrieve and process tweets created by the specified User ID, filtering them by recent posts, specific dates, or tweet IDs.

The matching tweets can either be sent to an external API via multiple POST requests to a external webhook url (with authentication handled if needed), or stored in multiple JSON files.

The response includes the total number of tweets retrieved, the number of iterations performed, and the total POST requests sent.
Pagination is handled to ensure complete data processing.

Prompts examples:

```
Process all tweets and conversations from one hour ago up to now, for each of the following:
- 1852674305517342720
- 1849681919253925888
- 223921570

Create one task per user. For each task, post the conversations data to: https://example.com/api/v1/tweets
Use the Bearer token stored in the secret.

In case of any error while processing a user, skip to the next user without stopping the process.
```
```
Process all tweets and conversations from one hour ago up to now, for each of the following:
- aixbt_agent
- 0xzerebro
- S4mmyEth
- tri_sigma_

Create one task per user.
In case of any error while processing a user, skip to the next user without stopping the process.
```

### 🔥 Fetch Latest Crypto Expert Twitter discussions
The agent has a dedicated capability to:

- Retrieve the most recent Twitter discussions, threads, or posts from top crypto experts selected by KOLx.fun.
- Aggregate and structure these conversations in a clean JSON format.
- Provide essential metadata for each conversation (e.g., timestamp, expert username, post content, engagement metrics).
- Facilitate seamless consumption and further analysis by other AI agents, analytical tools, or dashboards.

This capability is ideal for:

- Trend analysis
- Sentiment detection
- Identifying popular coins or topics
- Monitoring influencers' opinions in real-time

```
Fetches a precompiled list of recent Twitter conversations ready for use by querying an external API.
The retrieved conversations are then saved into a file for further processing or usage. 
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
