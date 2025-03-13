import 'dotenv/config'
import { CustomAgent } from './custom-agent'
import { HelloCapability } from './capabilities/HelloCapability'

// Create the agent
const agent = new CustomAgent({
  systemPrompt: 'You are an agent that '
})

agent.addCapabilities([HelloCapability])

// Start the agent's HTTP server
agent.start()

async function main() {
  const HelloCapabilityTesting = await agent.process({
    messages: [
      {
        role: 'user',
        content: 'Say hello to Swell'
      }
    ]
  })

  console.log('HelloCapabilityTesting:', HelloCapabilityTesting.choices[0].message.content)
}

main().catch(console.error)
