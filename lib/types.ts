export interface CliCommand {
  description: string
  args?: string
  help?: string
  params?: {[paramName: string]: string}

  handler(config: {}, args: string[], params: object): Promise<void>
}

export interface OPItem {
  uuid: string
  details: {
    sections: Array<{
      name: string
      title: string
      fields: Array<{t: string; v: string}>
    }>
    notesPlain: string
  }
  overview: {
    tags: string[]
    title: string
  }
}
