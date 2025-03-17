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
    return this.hasTask()
  }

  hasTask(): this is {
    action: { type: 'do-task'; workspace: { id: number }; task: { id: number } }
  } {
    return !!this.action && this.action.type === 'do-task' && 'task' in this.action
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
    if (!this.action || this.action.type !== 'do-task') return

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
    if (!this.action || this.action.type !== 'do-task') return

    return await this.agent.updateTaskStatus({
      workspaceId: this.action.workspace.id,
      taskId: this.action.task.id,
      status
    })
  }

  getLastHumanAssistanceResponse(): string | null {
    if (!this.action || this.action.type !== 'do-task') return null

    if (this.action.task?.humanAssistanceRequests) {
      return this.action.task.humanAssistanceRequests.at(-1)?.humanResponse ?? null
    }
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async sendChatMessage(message: string): Promise<any> {
    if (!this.action || this.action.type !== 'do-task') return

    return await this.agent.sendChatMessage({
      workspaceId: this.action.workspace.id,
      agentId: this.action.me.id,
      message
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async uploadFile(params: HelperUploadFileParams): Promise<any> {
    if (!this.action || this.action.type !== 'do-task') return

    const payload = {
      workspaceId: this.action.workspace.id,
      path: params.path,
      file: params.file,
      skipSummarizer: params.skipSummarizer || false,
      taskIds: params.taskIds ?? this.action?.task.id
    }
    return await this.agent.uploadFile(payload)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getFiles(): Promise<any> {
    if (!this.action || this.action.type !== 'do-task') return

    return await this.agent.getFiles({
      workspaceId: this.action.workspace.id
    })
  }

  getAbsoluteUrl(relativeFile: string, files: Array<{ path: string; fullUrl: string }>): string {
    const fileName = relativeFile.split('/').pop()
    console.log('fileName', fileName)
    const file = files.find(f => f.path === fileName)
    console.log('file', file)
    return file ? file.fullUrl : relativeFile
  }
}

export interface HelperUploadFileParams {
  path: string
  taskIds?: number[] | number | null
  skipSummarizer?: boolean
  file: Buffer | string
}
