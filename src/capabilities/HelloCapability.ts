import { z } from 'zod'
import { CustomAgent } from '../custom-agent'
import { actionSchema } from '@openserv-labs/sdk/dist/types'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { TaskHelper } from '../helpers/TaskHelper'

const schema = z.object({
  username: z.string().describe('The username to say hello to')
})

export const HelloCapability = {
  name: 'Hello',
  description: 'Say hello world to someone',
  schema,
  async run(
    this: CustomAgent,
    { args, action }: { args: z.infer<typeof schema>; action?: z.infer<typeof actionSchema> },
    messages: ChatCompletionMessageParam[]
  ): Promise<string> {
    const helper = new TaskHelper(action, this)

    if (!helper.isDoTask()) {
      console.log(action, messages)
      return 'Not implemented'
    }

    console.log('args:', args)
    return `Hello ${args.username} form capability`

    /*
    const helper = new TaskHelper(action, this)

    if (!helper.isDoTask()) {
      console.log(action, messages)
      return 'Not implemented'
    }

    await helper.logInfo(`Task Say hello : ${args.username}`)

    await helper.sendChatMessage(`Hello : ${args.username}`)

    return `Hello ${args.username} form capability`
    */
  }
}
