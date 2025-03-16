import { z } from 'zod'
import { CustomAgent } from '../custom-agent'
import { actionSchema } from '@openserv-labs/sdk/dist/types'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { TaskHelper } from '../helpers/TaskHelper'
import { debugLogger } from '../helpers/Helpers'
//import { TelegramService } from '../services/TelegramService'

const schema = z.object({
  message: z.string().describe('Telegram message')
})

export const PostMessageOnTelegramCapability = {
  name: 'PostMessageOnTelegramCapability',
  description: 'Post a message on Telegram and retrieve the message ID if successful.',
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

    if (!action || action.type !== 'do-task') return ''

    await this.requestHumanAssistance({
      workspaceId: action.workspace.id,
      taskId: action.task.id,
      type: 'text',
      question: 'Need Telegram integration.'
    })

    /*
    await helper.logInfo('Posting Message on Telegram')
    const TelegramService = new TelegramService(this, action)

    const response = await this.callIntegration({
      workspaceId: action.workspace.id,
      integrationId: 'Telegram-v2',
      details: {
        endpoint: '/2/Messages',
        method: 'POST',
        data: {
          text: args.message
        }
      }
    })

    // Check if integration calling has errors
    checkIntegrationErrors(response, 'Telegram-v2')

    // Telegram response
    debugLogger('Telegram-v2 response', response)

    const MessageId = response.output?.data?.id
    const MessageText = response.output?.data?.text

    if (MessageId && MessageText) {
      const Message = {
        text: MessageText,
        id: MessageId
      }

      return `Message successfully posted on Telegram :
          Message: ${JSON.stringify(Message, null, 2)}`
    }
    */
    return 'Message can not be posted on Telegram'
  }
}
