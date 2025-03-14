import 'dotenv/config'
import { CustomAgent } from './custom-agent'
import { ScrapeTweetFromUserCapability } from './capabilities/ScrapeTweetFromUserCapability'

// Create the agent
const agent = new CustomAgent({
  systemPrompt:
    'You are an agent that scrape Twitter Posts and Discussions from user and POST to an endpoint'
})

agent.addCapabilities([ScrapeTweetFromUserCapability])

// Start the agent's HTTP server
agent.start()

/*
async function main() {
  const ScrapeTesting = await agent.process({
    messages: [
      {
        role: 'user',
        content: 'Scrape 100 latest tweets from AIXBT (user_id : 1852674305517342720)'
      }
    ]
  })

  console.log('ScrapeTesting:', ScrapeTesting.choices[0].message.content)
}

main().catch(console.error)
*/
