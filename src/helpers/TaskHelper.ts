import { z } from 'zod'
import { Agent } from '@openserv-labs/sdk'
import { actionSchema } from '@openserv-labs/sdk/dist/types'

export class TaskHelper {
  private action: z.infer<typeof actionSchema> | undefined
  private agent: Agent

  constructor(action: z.infer<typeof actionSchema> | undefined, agent: Agent) {
    if (action) {
      this.action = action
    }
    this.agent = agent
  }

  isDoTask(): boolean {
    if (!this.action) {
      return true // for local testing
    }
    return this.action.type === 'do-task'
  }

  async logInfo(message: string) {
    return this.log('info', message)
  }

  async logWarning(message: string) {
    return this.log('warning', message)
  }

  async logError(message: string) {
    return this.log('error', message)
  }

  private async log(severity: 'info' | 'warning' | 'error', message: string) {
    if (!('task' in this.action)) return

    return await this.agent.addLogToTask({
      workspaceId: this.action.workspace.id,
      taskId: this.action.task.id,
      severity,
      type: 'text',
      body: message
    })
  }

  async updateStatus(
    status: 'to-do' | 'in-progress' | 'done' | 'error' | 'human-assistance-required' | 'cancelled'
  ) {
    if (!('task' in this.action)) return

    return await this.agent.updateTaskStatus({
      workspaceId: this.action.workspace.id,
      taskId: this.action.task.id,
      status
    })
  }

  getLastHumanAssistanceResponse(): string | null {
    if ('task' in this.action && this.action.task?.humanAssistanceRequests) {
      return this.action.task.humanAssistanceRequests.at(-1)?.humanResponse ?? null
    }
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async sendChatMessage(message: string): Promise<any> {
    return await this.agent.sendChatMessage({
      workspaceId: this.action.workspace.id,
      agentId: this.action.me.id,
      message
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async uploadFile(params: HelperUploadFileParams): Promise<any> {
    return await this.agent.uploadFile({
      workspaceId: this.action.workspace.id,
      path: params.path,
      file: params.file,
      skipSummarizer: params.skipSummarizer || false,
      taskIds: params.taskIds ?? [this.action?.task.id]
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getFiles(): Promise<any> {
    return await this.agent.getFiles({
      workspaceId: this.action.workspace.id
    })
  }
}

export interface HelperUploadFileParams {
  path: string
  taskIds?: number[] | number | null
  skipSummarizer?: boolean
  file: Buffer | string
}
