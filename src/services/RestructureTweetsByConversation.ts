interface TwitterApiResponse {
  data: any[]
  includes?: {
    users?: {
      id: string
      username: string
      name: string
      profile_image_url: string
      verified: boolean
      created_at: string
      public_metrics: {
        followers_count: number
        following_count: number
        tweet_count: number
        listed_count: number
      }
    }[]
    tweets?: any[]
  }
}

export function RestructureTweetsByConversation(apiResponse: TwitterApiResponse) {
  // Create a Map for quick access to user details
  const usersMap = new Map(apiResponse.includes?.users?.map(user => [user.id, user]) || [])

  // Merge both main tweets (data) and referenced tweets (includes.tweets) into a single Map
  const allTweets = new Map(
    [...apiResponse.data, ...(apiResponse.includes?.tweets || [])].map(tweet => [tweet.id, tweet])
  )

  // Group tweets by conversation_id
  const conversationsMap = new Map<
    string,
    { conversation_id: string; created_by_user_id: string; created_at: string; tweets: any[] }
  >()

  allTweets.forEach(tweet => {
    // Preserve original tweet structure and add a "user" object with additional details
    const tweetWithUser = {
      ...tweet,
      author: usersMap.has(tweet.author_id)
        ? {
            id: tweet.author_id,
            username: usersMap.get(tweet.author_id)!.username,
            name: usersMap.get(tweet.author_id)!.name,
            profile_image_url: usersMap.get(tweet.author_id)!.profile_image_url,
            verified: usersMap.get(tweet.author_id)!.verified,
            public_metrics: usersMap.get(tweet.author_id)!.public_metrics,
            created_at: usersMap.get(tweet.author_id)!.created_at
          }
        : null
    }

    if (!conversationsMap.has(tweet.conversation_id)) {
      // Initialize a conversation with metadata from the first tweet
      conversationsMap.set(tweet.conversation_id, {
        conversation_id: tweet.conversation_id,
        created_by_user_id: tweet.author_id,
        created_at: tweet.created_at,
        tweets: []
      })
    }

    // Add the tweet to its respective conversation
    conversationsMap.get(tweet.conversation_id)!.tweets.push(tweetWithUser)
  })

  // Sort tweets in each conversation by created_at
  conversationsMap.forEach(conversation => {
    conversation.tweets.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    // The first tweet in the conversation is considered the creator
    conversation.created_by_user_id = conversation.tweets[0].author_id
    conversation.created_at = conversation.tweets[0].created_at
  })

  return Array.from(conversationsMap.values())
}
