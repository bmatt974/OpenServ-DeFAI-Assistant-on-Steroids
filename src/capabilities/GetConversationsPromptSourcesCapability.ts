import { z } from 'zod'
import { CustomAgent } from '../custom-agent'
import { actionSchema } from '@openserv-labs/sdk/dist/types'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { TaskHelper } from '../helpers/TaskHelper'
import { FetchService } from '../services/FetchService'

const schema = z.object({
  username: z.string().describe('The username to say hello to')
})

export const GetConversationsPromptSourcesCapability = {
  name: 'GetConversationsPromptSourcesCapability',
  description:
    'Retrieves the latest Twitter conversations as structured JSON data, intended to be used as contextual input for prompt-based content generation. Returns an empty result if no new conversations are found during the specified timeframe.',
  schema,
  async run(
    this: CustomAgent,
    { args, action }: { args: z.infer<typeof schema>; action?: z.infer<typeof actionSchema> },
    messages: ChatCompletionMessageParam[]
  ): Promise<string> {
    console.log('args:', args)
    const helper = new TaskHelper(action, this)
    const apiBaseUrl: string = process.env.COINALERT_API_URL || ''
    const bearerToken: string = process.env.COINALERT_TOKEN_BEARER || ''

    const fetchService = FetchService(
      { type: 'bearer', token: bearerToken },
      { baseURL: apiBaseUrl }
    )

    helper.logInfo('Fetching conversations prompt for the latest conversations...')
    const response = await fetchService.get('/api/v1/twitter/conversations/prompting')

    console.log('response:', response.data)
    return JSON.stringify(response.data, null, 2)
  }
}
