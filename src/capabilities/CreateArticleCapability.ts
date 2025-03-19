import { z } from 'zod'
import { CustomAgent } from '../custom-agent'
import { actionSchema } from '@openserv-labs/sdk/dist/types'
import type { ChatCompletionMessageParam } from '../types/openai'
import { TaskHelper } from '../helpers/TaskHelper'
import { FetchService } from '../services/FetchService'
import { debugLogger } from '../helpers/Helpers'

const schema = z.object({
  title: z.string().describe('The title of the article.'),
  description: z.string().describe('The description of the article.'),
  body: z.string().describe('The content of the article in Markdown format.'),
  image_url: z.string().url().describe("Image URL pour illustrer l'article."),
  webhook_url: z
    .string()
    .url({ message: 'webhook_url must be a valid URL' })
    .describe('External URL where article will be posted (must be a valid URL).'),
  webhook_auth: z
    .object({
      type: z
        .enum(['bearer', 'basic', 'apiKey'])
        .describe(
          "Authentication type: 'bearer' (Bearer Token), 'basic' (Basic Auth), or 'apiKey' (API Key)."
        ),
      token: z
        .string()
        .optional()
        .describe("Bearer token for authorization (if type is 'bearer')."),

      username: z.string().optional().describe("Username for Basic Auth (if type is 'basic')."),

      password: z.string().optional().describe("Password for Basic Auth (if type is 'basic')."),

      apiKey: z.string().optional().describe("API Key value (if type is 'apiKey')."),

      apiKeyHeader: z
        .string()
        .optional()
        .describe("Header name for API Key (if type is 'apiKey', e.g., 'X-API-Key').")
    })
    .optional()
})

export const CreateArticleCapability = {
  name: 'CreateArticleCapability',
  description:
    'Creates a new article on the website using the provided title, description, Markdown body, and image URL. Returns the URL of the published article if creation is successful.',
  schema,
  async run(
    this: CustomAgent,
    { args, action }: { args: z.infer<typeof schema>; action?: z.infer<typeof actionSchema> },
    messages: ChatCompletionMessageParam[]
  ): Promise<string> {
    const helper = new TaskHelper(action, this)
    const payload = args

    const files = await helper.getFiles()
    payload.image_url = helper.getAbsoluteUrl(args.image_url, files)

    debugLogger('files', files)

    debugLogger('payload', JSON.stringify(payload, null, 2))

    const fetchService = FetchService(args.webhook_auth)

    helper.logInfo('Posting data to API for creating article.')
    const response = await fetchService.post(args.webhook_url, payload)

    console.log('response:', response.data)
    return JSON.stringify(response.data, null, 2)
  }
}
