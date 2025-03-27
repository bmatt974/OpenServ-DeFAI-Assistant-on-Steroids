import { z } from 'zod'
import { CustomAgent } from '../custom-agent'
import { actionSchema } from '@openserv-labs/sdk/dist/types'
import type { ChatCompletionMessageParam } from '../types/openai'
import { TaskHelper } from '../helpers/TaskHelper'
import { FetchService } from '../services/FetchService'
import { debugLogger } from '../helpers/Helpers'

const schema = z.object({
  username: z.string().optional().describe('Twitter username to fetch Twitter conversations posts'),
})

export const GetConversationsPromptSourcesByUsernameCapability = {
  name: 'GetConversationsPromptSourcesByUsernameCapability',
  description: `Fetch recent Twitter conversations for a specific expert from an external API.
  Store the conversations in a single JSON file for the given expert.`,
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

    helper.logInfo(`Fetching ${args.username} conversations data`)
    const response = await fetchService.get(
      `/api/v1/twitter/${args.username}/conversations/prompting`
    )

    if (response.status === 200) {
      const experts = response.data

      for (let index = 0; index < experts.length; index++) {
        const expert = experts[index]
        const filename = `conversations_${expert.expert.username}.json`
        const fileContent = JSON.stringify(expert, null, 2)

        const payloadFile = {
          path: filename,
          file: fileContent
        }

        console.log(`Saving file: ${filename}`)

        try {
          await helper.uploadFile(payloadFile)
          console.log(`File ${filename} saved successfully.`)
        } catch (error) {
          if (error instanceof Error) {
            debugLogger('Error:', error.message)
            console.log(error.message)
          } else {
            debugLogger('Unknown error:', error)
            console.log(error)
          }

          console.log(`Error saving file: ${filename}`)
        }
      }

      return `Twitter conversations for ${args.username} processed.`
    }

    return JSON.stringify(response.data, null, 2)
  }
}
