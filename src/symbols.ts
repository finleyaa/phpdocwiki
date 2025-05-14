import * as vscode from 'vscode';

export class Parameter {
  constructor(
    public readonly name: string,
    public readonly type: string | null,
    public readonly description: string | null
  ) {}
}

export class Method {
  constructor(
    public readonly name: string,
    public readonly description: string | null,
    public readonly parameters: Parameter[] = []
  ) {}
}

export class Class {
  constructor(
    public readonly name: string,
    public readonly description: string | null,
    public readonly methods: Method[] = [],
    public readonly uri: vscode.Uri | null = null,
  ) {}
}