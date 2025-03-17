import { z } from 'zod'
import { CustomAgent } from '../custom-agent'
import { actionSchema } from '@openserv-labs/sdk/dist/types'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { TaskHelper } from '../helpers/TaskHelper'
import { FetchService } from '../services/FetchService'
import { debugLogger } from "../helpers/Helpers";

const schema = z.object({
  //url: z.string().url().optional().describe('The API endpoint URL to post data.')
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

    if (response.status === 200) {
      const filename = 'latest_conversation.json'
      const fileContent = JSON.stringify(response.data, null, 2)
      const payloadFile = {
        path: filename,
        file: fileContent
      }

      try {
        await helper.uploadFile(payloadFile)
        return `Conversations fetched successfully. Content is on file : ${filename}`
      } catch (error) {
        if (error instanceof Error) {
          debugLogger('Error:', error.message)
        } else {
          debugLogger('Unknown error:', error)
        }
        return `Error saving file : ${filename}`
      }
    }

    return JSON.stringify(response.data, null, 2)
  }
}
