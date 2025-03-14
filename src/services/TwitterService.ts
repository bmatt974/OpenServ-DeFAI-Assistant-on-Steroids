import {
  checkIntegrationErrors,
  cleanQueryParams,
  debugLogger,
  isDoTaskAction
} from '../helpers/Helpers'
import { Agent } from '@openserv-labs/sdk'
import type { z } from 'zod'
import { doTaskActionSchema } from '@openserv-labs/sdk/dist/types'

export class TwitterService {
  constructor(
    private agent: Agent,
    private action: z.infer<typeof doTaskActionSchema>
  ) {}

  async getUserId(user_id?: string, username?: string): Promise<string | null> {
    if (user_id) return user_id

    if (username) {
      return this.fetchUserIdByUsername(username)
    }

    await this.agent.requestHumanAssistance({
      workspaceId: this.action.workspace.id,
      taskId: this.action.task.id,
      type: 'text',
      question: 'Please provide a valid Twitter username or user id.'
    })

    return null
  }

  async fetch(
    url: string,
    availableQueryParams: Record<string, string | number | undefined | null>
  ) {
    const queryParams = cleanQueryParams(availableQueryParams)

    debugLogger('endpointUrl', url)
    debugLogger('queryParams', queryParams)

    const response = await this.agent.callIntegration({
      workspaceId: this.action.workspace.id,
      integrationId: 'twitter-v2',
      details: {
        endpoint: url,
        method: 'GET',
        params: queryParams
      }
    })

    // Check if integration calling has errors
    checkIntegrationErrors(response, 'Twitter-v2')

    // Twitter response
    debugLogger('twitter-v2 response', response.output)

    return response
  }

  /**
   * Twitter Id Finder lookup
   * @param username
   */
  public async fetchUserIdByUsername(username: string) {
    if (!isDoTaskAction(this.action)) return

    await this.agent.addLogToTask({
      workspaceId: this.action.workspace.id,
      taskId: this.action.task.id,
      severity: 'info',
      type: 'text',
      body: `Twitter user lookup by username : ${username}`
    })

    const response = await this.agent.callIntegration({
      workspaceId: this.action.workspace.id,
      integrationId: 'twitter-v2',
      details: {
        endpoint: `/2/users/by/username/${username}`,
        method: 'GET'
      }
    })

    if (response?.output?.data?.id) {
      debugLogger('User lookup by username', response)

      const user_id = response.output.data.id

      await this.agent.addLogToTask({
        workspaceId: this.action.workspace.id,
        taskId: this.action.task.id,
        severity: 'info',
        type: 'text',
        body: `${username} user id is : ${user_id}`
      })

      return user_id
    }

    throw new Error(`${username} user id not found`)
  }
}

export const TWITTER_USER_FIELDS = [
  'affiliation',
  'connection_status',
  'created_at',
  'description',
  'entities',
  'id',
  'is_identity_verified',
  'location',
  'most_recent_tweet_id',
  'name',
  'parody',
  'pinned_tweet_id',
  'profile_banner_url',
  'profile_image_url',
  'protected',
  'public_metrics',
  'receives_your_dm',
  'subscription',
  'subscription_type',
  'url',
  'username',
  'verified',
  'verified_followers_count',
  'verified_type',
  'withheld'
] as const

export const TWITTER_TWEET_FIELDS = [
  'article',
  'attachments',
  'author_id',
  'card_uri',
  'community_id',
  //'context_annotations',
  'conversation_id',
  'created_at',
  //'display_text_range',
  //'edit_controls',
  //'edit_history_tweet_ids',
  'entities',
  'geo',
  'id',
  'in_reply_to_user_id',
  'lang',
  'media_metadata',
  'note_tweet',
  //'possibly_sensitive',
  'public_metrics',
  'referenced_tweets',
  'reply_settings',
  'scopes',
  'source',
  'text',
  'withheld'
] as const

export const TWITTER_MEDIA_FIELDS = [
  'alt_text',
  'duration_ms',
  'height',
  'media_key',
  'non_public_metrics',
  'organic_metrics',
  'preview_image_url',
  'promoted_metrics',
  'public_metrics',
  'type',
  'url',
  'variants',
  'width'
] as const

export const TWITTER_POLL_FIELDS = [
  'duration_minutes',
  'end_datetime',
  'id',
  'options',
  'voting_status'
] as const

export const TWITTER_PLACE_FIELDS = [
  'contained_within',
  'country',
  'country_code',
  'full_name',
  'geo',
  'id',
  'name',
  'place_type'
] as const

export const TWITTER_EXPANSIONS = [
  'article.cover_media',
  'article.media_entities',
  'attachments.media_keys',
  'attachments.media_source_tweet',
  'attachments.poll_ids',
  'author_id',
  'edit_history_tweet_ids',
  'entities.mentions.username',
  'geo.place_id',
  'in_reply_to_user_id',
  'entities.note.mentions.username',
  'referenced_tweets.id',
  'referenced_tweets.id.author_id'
] as const
