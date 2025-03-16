import { z } from 'zod'
import { CustomAgent } from '../custom-agent'
import { actionSchema } from '@openserv-labs/sdk/dist/types'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { TaskHelper } from '../helpers/TaskHelper'
import { debugLogger } from '../helpers/Helpers'
import { TwitterService } from '../services/TwitterService'

const schema = z.object({
  message: z.string().describe('Tweet content message')
})

export const PostMessageOnTwitterCapability = {
  name: 'PostMessageOnTwitterCapability',
  description: 'Post a tweet message on Twitter and retrieve the Tweet ID if successful.',
  schema,
  async run(
    this: CustomAgent,
    { args, action }: { args: z.infer<typeof schema>; action?: z.infer<typeof actionSchema> },
    messages: ChatCompletionMessageParam[]
  ): Promise<string> {
    debugLogger('args:', args)
    const helper = new TaskHelper(action, this)

    if (!helper.isDoTask()) {
      debugLogger(action, messages)
      return 'Not implemented'
    }

    if (!action || action.type !== 'do-task') return 'Not implemented'

    await helper.logInfo('Posting tweet on Twitter')
    const twitterService = new TwitterService(this, action)
    const response = await twitterService.post('/2/tweets', {
      text: args.message
    })

    debugLogger('twitter-v2 outside', response)

    const tweetId = response.output?.data?.id
    const tweetText = response.output?.data?.text

    if (tweetId && tweetText) {
      const tweet = {
        text: tweetText,
        id: tweetId
      }

      return `Message successfully posted on Twitter :
          Tweet: ${JSON.stringify(tweet, null, 2)}`
    }

    return 'Tweet can not be posted on Twitter'
  }
}
