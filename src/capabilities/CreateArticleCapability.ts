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
  image_url: z.string().url().describe("Image URL pour illustrer l'article.")
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
    const apiBaseUrl: string = process.env.COINALERT_API_URL || ''
    const bearerToken: string = process.env.COINALERT_TOKEN_BEARER || ''
    const payload = args

    const files = await helper.getFiles()
    payload.image_url = helper.getAbsoluteUrl(args.image_url, files)

    debugLogger('files', files)

    debugLogger('payload', JSON.stringify(payload, null, 2))

    const fetchService = FetchService(
      { type: 'bearer', token: bearerToken },
      { baseURL: apiBaseUrl }
    )

    helper.logInfo('Posting data to API for creating article.')
    const response = await fetchService.post('/api/v1/articles', payload)

    console.log('response:', response.data)
    return JSON.stringify(response.data, null, 2)
  }
}
