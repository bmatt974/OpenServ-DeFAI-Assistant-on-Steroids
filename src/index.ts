import 'dotenv/config'
import { CustomAgent } from './custom-agent'
import { ScrapeTweetFromUserCapability } from './capabilities/ScrapeTweetFromUserCapability'
import { GetConversationsPromptSourcesCapability } from './capabilities/GetConversationsPromptSourcesCapability'
import { PostMessageOnTwitterCapability } from './capabilities/PostMessageOnTwitterCapability'
import { PostMessageOnTelegramCapability } from './capabilities/PostMessageOnTelegramCapability'
import { CreateArticleCapability } from './capabilities/CreateArticleCapability'

// Create the agent
const agent = new CustomAgent({
  systemPrompt:
    'You are an agent that scrapes posts and discussions from various sources and POSTs the structured data to an endpoint. Retrieves the latest conversations as structured JSON data, intended to be used as contextual input for prompt-based content generation. Additionally, this agent interacts with and updates website content based on the processed data. Posting messages on Twitter and Telegram when required.'
})

agent.addCapabilities([
  ScrapeTweetFromUserCapability,
  GetConversationsPromptSourcesCapability,
  CreateArticleCapability,
  PostMessageOnTwitterCapability,
  PostMessageOnTelegramCapability
])

// Start the agent's HTTP server
agent.start()
