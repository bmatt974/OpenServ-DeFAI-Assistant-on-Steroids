import { z } from 'zod'
import { Agent } from '@openserv-labs/sdk'
import { actionSchema } from '@openserv-labs/sdk/dist/types'
import type { ChatCompletionMessageParam } from '../types/openai'
import { TaskHelper } from '../helpers/TaskHelper'
import { debugLogger } from '../helpers/Helpers'
import {
  TWITTER_EXPANSIONS,
  TWITTER_MEDIA_FIELDS,
  TWITTER_PLACE_FIELDS,
  TWITTER_POLL_FIELDS,
  TWITTER_TWEET_FIELDS,
  TWITTER_USER_FIELDS,
  TwitterService
} from '../services/TwitterService'
import { RestructureTweetsByConversation } from '../services/RestructureTweetsByConversation'
import { FetchService, formatFetchError } from '../services/FetchService'

const schema = z.object({
  user_id: z.string().optional().describe('Twitter user ID to fetch tweets'),
  username: z.string().optional().describe('Twitter username ID to fetch tweets'),
  max_results: z
    .number()
    .min(5, 'The minimum value for max_results is 5')
    .max(100, 'The maximum value for max_results is 100')
    .default(100)
    .describe('The maximum number of results (between 5 and 100)'),
  // The `start_time` query parameter value must be before the `end_time` query parameter value
  start_time: z
    .string()
    .datetime()
    .optional()
    .describe(
      'YYYY-MM-DDTHH:mm:ssZ. The oldest UTC timestamp from which the Posts will be provided.'
    ),
  end_time: z
    .string()
    .datetime()
    .optional()
    .default('2025-02-01T23:59:59Z')
    .describe(
      'YYYY-MM-DDTHH:mm:ssZ. The newest, most recent UTC timestamp to which the Posts will be provided.'
    ),
  // The `since_id` query parameter value must be less than the `until_id` query parameter value.
  since_id: z
    .string()
    .optional()
    .describe(
      'Returns results with a Post ID greater than (that is, more recent than) the specified ID.'
    ),
  until_id: z
    .string()
    .optional()
    .describe('Returns results with a Post ID less than (that is, older than) the specified ID.'),
  pagination_token: z
    .string()
    .optional()
    .describe("This parameter is used to get the next 'page' of results."),
  webhook_url: z
    .string()
    .url({ message: 'webhook_url must be a valid URL' })
    .optional()
    .describe('External URL where each conversation will be posted (must be a valid URL).'),
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

export const ScrapeTweetFromUserCapability = {
  name: 'ScrapeTweetFromUserCapability',
  description: `Retrieve and process tweets created by the specified User ID, filtering them by recent posts, specific dates, or tweet IDs.
The matching tweets can either be sent to an external API via multiple POST requests to a webhook, with authentication handled, or stored in multiple JSON files.
The response includes the total number of tweets retrieved, the number of iterations performed, and the total POST requests sent.
Pagination is handled to ensure complete data processing.`,
  schema,
  async run(
    this: Agent,
    { args, action }: { args: z.infer<typeof schema>; action?: z.infer<typeof actionSchema> },
    messages: ChatCompletionMessageParam[]
  ): Promise<string> {
    debugLogger('args:', args)
    const helper = new TaskHelper(action, this)

    if (!helper.isDoTask()) {
      debugLogger(action, messages)
      return 'Not implemented'
    }

    if (!action || action.type !== 'do-task') return ''
    let totalTweets = 0
    let totalWebhookPosts = 0
    const uploadedFiles: string[] = []

    try {
      const twitterService = new TwitterService(this, action)
      const user_id = await twitterService.getUserId(args.user_id, args.username)

      if (!user_id) {
        throw new Error('Twitter user ID is missing')
      }

      const fetchService = FetchService(args.webhook_auth)

      let iterationCount = 0

      await fetchAndProcessTweets(
        helper,
        twitterService,
        user_id,
        args,
        async function (conversationCollection: any[], hash: string | undefined) {
          iterationCount++
          totalTweets += conversationCollection.length

          debugLogger('Processing batch of', conversationCollection.length, 'conversations')

          // Post Twitter Conversation to an external webhook
          if (args.webhook_url) {
            await helper.logInfo('POSTing each conversations to WEBHOOK')
            for (const conversation of conversationCollection) {
              //debugLogger('conversation:', conversation)
              totalWebhookPosts++

              try {
                //const infoMessage = `POST conversations #${conversation.conversation_id} to WEBHOOK`
                //await helper.logInfo(infoMessage)
                const apiResponse = await fetchService.post(args.webhook_url, conversation)
                debugLogger('POST response:', apiResponse.status)
              } catch (error) {
                const errorResponse = formatFetchError(error)
                await helper.logWarning(
                  `POST request error: ${errorResponse.message} (Status: ${errorResponse.status}) - Ignore, continue processing`
                )
              }
            }
          } else {
            // Or store inside JSON file
            const batchFileName = `twitter-conversations-user-${user_id}-batch-${hash ?? null}.json`
            helper.logInfo(`Storing conversation inside ${batchFileName} file`)

            //console.log('conversationCollection', conversationCollection)

            await helper.uploadFile({
              path: batchFileName,
              file: JSON.stringify(conversationCollection, null, 2)
            })

            uploadedFiles.push(batchFileName)
          }
        }
      )

      if (totalTweets === 0) {
        debugLogger('return : ', 'No tweets found')
        await helper.updateStatus('done')

        return `No more tweets to process for Twitter user ID ${args.user_id}.`
      }
      debugLogger('return : ', 'Successfully')
      await helper.updateStatus('done')

      if (args.webhook_url) {
        return `Successfully retrieved and processed ${totalTweets} tweets (in ${iterationCount} iterations) from the specified User ID, filtered by the given criteria, and sent them to the external API in ${totalWebhookPosts} POSTs request.`
      } else {
        const fileList = uploadedFiles.map(file => `- ${file}`).join('\n')
        return `Successfully retrieved and processed ${totalTweets} tweets (in ${iterationCount} iterations) from the specified User ID, filtered by the given criteria, and stored them as JSON files:\n${fileList}`
      }
    } catch (error) {
      debugLogger('Run() error', error)

      const ErrorMessage = error instanceof Error ? error.message : 'Unknown error'
      await this.markTaskAsErrored({
        workspaceId: action.workspace.id,
        taskId: action.task.id,
        error: ErrorMessage
      })

      return `Tweets could not be retrieve from Twitter user ID ${args.user_id}.
            Errors : ${ErrorMessage}`
    }
  }
}

async function fetchAndProcessTweets(
  helper: TaskHelper,
  twitterService: TwitterService,
  user_id: string,
  args: any,
  processTweets: (conversationCollection: any[], hash: string | undefined) => Promise<void>
) {
  let pagination_token: string | undefined = args.pagination_token

  do {
    const infoMessage = `Retrieving the ${args.max_results} latest tweets from the Twitter user with ID: ${user_id} and pagination_token: ${pagination_token}`
    await helper.logInfo(infoMessage)

    const queryParams = {
      max_results: args.max_results,
      pagination_token,
      start_time: '2025-02-01T00:00:00Z', //args.start_time,
      //end_time: args.end_time,
      since_id: args.since_id,
      until_id: args.until_id,
      'tweet.fields': TWITTER_TWEET_FIELDS.join(','),
      'media.fields': TWITTER_MEDIA_FIELDS.join(','),
      'poll.fields': TWITTER_POLL_FIELDS.join(','),
      'user.fields': TWITTER_USER_FIELDS.join(','),
      'place.fields': TWITTER_PLACE_FIELDS.join(','),
      expansions: TWITTER_EXPANSIONS.join(',')
    }

    const endpointUrl = `2/users/${user_id}/tweets`
    const response = await twitterService.fetch(endpointUrl, queryParams)

    if (!response.output?.data) {
      debugLogger(`Warning: No tweets found for Twitter user ID: "${user_id}"`)
      break
    }

    const conversationCollection = RestructureTweetsByConversation(response.output)

    await processTweets(conversationCollection, pagination_token)

    pagination_token = response.output.meta?.next_token

    await new Promise(resolve => setTimeout(resolve, 500))
  } while (pagination_token)

  debugLogger('Finished fetchAndProcessTweets loop.')
}
