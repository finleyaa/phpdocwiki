import * as vscode from 'vscode';
import { Class, Method, Parameter } from './symbols';
import { index } from './parser';

export class PhpDocWikiTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private classes: Class[] = [];

    private readonly _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<
        vscode.TreeItem | undefined | void
    >();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (!element) {
            return this.getClassTreeItems();
        } else if (element instanceof ClassTreeItem) {
            return this.getMethodTreeItems(element.classEntity);
        } else if (element instanceof MethodTreeItem) {
            return this.getParameterTreeItems(element.methodEntity);
        }

        return Promise.resolve([]);
    }

    public updateClasses(classes: Class[]): void {
        this.classes = classes;
        this._onDidChangeTreeData.fire();
    }

    private getClassTreeItems(): Thenable<ClassTreeItem[]> {
        return new Promise((resolve) => {
            const treeItems: ClassTreeItem[] = this.classes.map((classEntity) => {
                return new ClassTreeItem(classEntity, classEntity.methods.length ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
            });
            resolve(treeItems);
        });
    }

    private getMethodTreeItems(classEntity: Class): Thenable<MethodTreeItem[]> {
        return new Promise((resolve) => {
            const treeItems: MethodTreeItem[] = classEntity.methods.map((methodEntity) => {
                return new MethodTreeItem(methodEntity, methodEntity.parameters.length ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
            });
            resolve(treeItems);
        });
    }

    private getParameterTreeItems(methodEntity: Method): Thenable<ParameterTreeItem[]> {
        return new Promise((resolve) => {
            const treeItems: ParameterTreeItem[] = methodEntity.parameters.map((parameterEntity) => {
                return new ParameterTreeItem(parameterEntity, vscode.TreeItemCollapsibleState.None);
            });
            resolve(treeItems);
        });
    }
}

class ClassTreeItem extends vscode.TreeItem {
    constructor(
        public readonly classEntity: Class,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    ) {
        const label = classEntity.name;
        super(label, collapsibleState);
        this.tooltip = label;
        this.description = classEntity.description ?? 'No description provided';
        this.command = {
            command: 'vscode.open',
            title: 'Open File',
            arguments: [classEntity.uri],
        };
    }
}

class MethodTreeItem extends vscode.TreeItem {
    constructor(
        public readonly methodEntity: Method,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    ) {
        const label = methodEntity.name;
        super(label, collapsibleState);
        this.tooltip = label;
        this.description = methodEntity.description ?? 'No description provided';
    }
}

class ParameterTreeItem extends vscode.TreeItem {
    constructor(
        public readonly parameterEntity: Parameter,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    ) {
        const label = parameterEntity.name;
        super(label, collapsibleState);
        this.tooltip = label;
        this.description = parameterEntity.description ?? 'No description provided';
    }
}