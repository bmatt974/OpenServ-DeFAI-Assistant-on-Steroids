import { z } from 'zod'
import { CustomAgent } from '../custom-agent'
import { actionSchema } from '@openserv-labs/sdk/dist/types'
import type { ChatCompletionMessageParam } from '../types/openai'
import { TaskHelper } from '../helpers/TaskHelper'
import { FetchService } from '../services/FetchService'
import { debugLogger } from '../helpers/Helpers'

const schema = z.object({
  //url: z.string().url().optional().describe('The API endpoint URL to post data.')
})

export const GetConversationsPromptSourcesCapability = {
  name: 'GetConversationsPromptSourcesCapability',
  description:
    'Process a pre-provided set of Twitter conversations to generate an article. Upon completion, return the name of the file where the generated content has been saved.',
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

    helper.logInfo('Loading conversations source file')
    const response = await fetchService.get('/api/v1/twitter/conversations/prompting')

    if (response.status === 200) {
      const filename = 'latest_conversation.json'
      const fileContent = JSON.stringify(response.data, null, 2)
      const payloadFile = {
        path: filename,
        file: fileContent
      }

      console.log(fileContent)

      try {
        await helper.uploadFile(payloadFile)
        return `File saved successfully.`
      } catch (error) {
        if (error instanceof Error) {
          debugLogger('Error:', error.message)
          console.log(error.message)
        } else {
          debugLogger('Unknown error:', error)
          console.log(error)
        }

        console.log(error)

        return `Error saving file : ${filename}`
      }
    }

    return JSON.stringify(response.data, null, 2)
  }
}
