import { z } from 'zod'
import { CustomAgent } from '../custom-agent'
import { actionSchema } from '@openserv-labs/sdk/dist/types'
import type { ChatCompletionMessageParam } from '../types/openai'
import { TaskHelper } from '../helpers/TaskHelper'
import { debugLogger } from '../helpers/Helpers'
import axios from 'axios'

const telegramChatId: string = process.env.TELEGRAM_CHAT_ID || ''
const telegramBotToken: string = process.env.TELEGRAM_BOT_TOKEN || ''

const schema = z.object({
  message: z.string().describe('Telegram message')
})

export const PostMessageOnTelegramCapability = {
  name: 'PostMessageOnTelegramCapability',
  description: 'Post a message on Telegram and retrieve the message information if successful.',
  schema,
  async run(
    this: CustomAgent,
    { args, action }: { args: z.infer<typeof schema>; action?: z.infer<typeof actionSchema> },
    messages: ChatCompletionMessageParam[]
  ): Promise<string> {
    if (!telegramChatId || !telegramBotToken) {
      throw new Error('Missing environment variables: TELEGRAM_CHAT_ID or TELEGRAM_BOT_TOKEN')
    }

    debugLogger('args:', args)
    const helper = new TaskHelper(action, this)

    if (!helper.isDoTask()) {
      debugLogger(action, messages)
      return 'Not implemented'
    }

    if (!action || action.type !== 'do-task') return ''

    try {
      /*
      const updateUrl = `https://api.telegram.org/bot${telegramBotToken}/getUpdates`
      const response3 = await axios.get(updateUrl)
      console.log('info_with_channel_id:', JSON.stringify(response3.data, null, 2))
      */

      const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`
      const payload = {
        chat_id: telegramChatId,
        text: args.message,
        parse_mode: 'HTML' // optional
      }
      debugLogger('payload', payload)
      const response = await axios.post(url, payload)

      debugLogger('Message sent :', response.data)

      return `Message successfully posted on Telegram :
          Message : ${JSON.stringify(response.data, null, 2)}`
    } catch (error) {
      if (error instanceof Error) {
        debugLogger('Error:', error.message)
      } else {
        debugLogger('Unknown error:', error)
      }
      return 'Error sending message'
    }

    /*
    // OpenServ integration
    const url = `/bot${telegramBotToken}/sendMessage`
    //const url = `/sendMessage`

    const response = await this.callIntegration({
      workspaceId: 123,
      integrationId: 'telegram',
      details: {
        endpoint: url,
        method: 'POST',
        data: {
          chat_id: telegramChatId, // '@ton_channel_username', // Ou l'ID du canal si privé
          text: 'Hello from my AI agent via Telegram!',
          parse_mode: 'HTML' // Optionnel
        }
      }
    })
    */

    return 'Message can not be posted on Telegram'
  }
}
