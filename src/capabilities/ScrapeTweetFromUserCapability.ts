import { z } from 'zod'
import { Agent } from '@openserv-labs/sdk'
import { actionSchema, doTaskActionSchema } from '@openserv-labs/sdk/dist/types'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
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

const apiBaseUrl: string = 'https://coinalert.swell.ovh/'
const bearerToken: string = 'D7nZtJH7pEJVTSH4EeR77AQMAvctEviy'

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
    .describe("This parameter is used to get the next 'page' of results.")
})

export const ScrapeTweetFromUserCapability = {
  name: 'GetUserTweet',
  description:
    'Returns a list of Posts authored by the provided User ID, filtering by latest posts, specific dates, or tweet IDs. If matching tweets are found based on the specified parameters, they will be saved in a JSON file. The response provides a summary of the retrieved tweets, including the total count, first and last tweet details, and the file location.',
  schema,
  async run(
    this: Agent,
    { args, action }: { args: z.infer<typeof schema>; action?: z.infer<typeof actionSchema> },
    messages: ChatCompletionMessageParam[]
  ): Promise<string> {
    console.log('args:', args)

    const helper = new TaskHelper(action, this)

    if (!helper.isDoTask()) {
      console.log(action, messages)
      return 'Not implemented'
    }

    if (!action || action.type !== 'do-task') return ''

    try {
      const twitterService = new TwitterService(this, action)
      const user_id = await twitterService.getUserId(args.user_id, args.username)
      const max_results = args.max_results

      const infoMessage = `Retrieving the ${max_results} latest tweets from the Twitter user with ID: ${user_id}`

      await helper.logInfo(infoMessage)

      // All Twitter Query params available
      const availableQueryParams = {
        max_results: args.max_results,
        pagination_token: args.pagination_token,
        start_time: args.start_time,
        end_time: args.end_time,
        since_id: args.since_id,
        until_id: args.until_id,
        'tweet.fields': TWITTER_TWEET_FIELDS.join(','),
        'media.fields': TWITTER_MEDIA_FIELDS.join(','),
        'poll.fields': TWITTER_POLL_FIELDS.join(','),
        'user.fields': TWITTER_USER_FIELDS.join(','),
        'place.fields': TWITTER_PLACE_FIELDS.join(','),
        expansions: TWITTER_EXPANSIONS.join(',')
      }

      // User Posts timeline by User ID
      // Returns a list of Posts authored by the provided User ID
      const endpointUrl = `2/users/${user_id}/tweets`
      const response = await twitterService.fetch(endpointUrl, availableQueryParams)

      // Tweets collection
      const output = response.output
      if (!output.data) {
        return `Warning: No tweets were found from Twitter user ID : "${user_id}"`
      }

      const tweetCollection = output.data
      //const newestTweet = tweetCollection[0]
      //const oldestTweet = tweetCollection[tweetCollection.length - 1]
      const conversationCollection = RestructureTweetsByConversation(output)

      const fetchService = FetchService(
        { type: 'bearer', token: bearerToken },
        { baseURL: apiBaseUrl }
      )

      for (const conversation of conversationCollection) {
        console.log('conversation:', conversation)

        try {
          const infoMessage = `POST conversations #${conversation.conversation_id} to API`
          await helper.logInfo(infoMessage)

          const apiResponse = await fetchService.post('/api/v1/twitter/conversations', conversation)

          console.log('POST response:', apiResponse)
        } catch (error) {
          const errorResponse = formatFetchError(error)

          await helper.logError(
            `POST request error: ${errorResponse.message} (Status: ${errorResponse.status})`
          )
        }
      }

      return JSON.stringify(conversationCollection)
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
