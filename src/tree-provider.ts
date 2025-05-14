import * as vscode from 'vscode';
import { Class } from './symbols';
import { index } from './parser';

export class PhpDocWikiTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private classes: Class[] = [];
    private readonly statusBarItem: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

    constructor(private readonly workspaceRoot: string) {
        this.statusBarItem.text = `$(sync~spin) Indexing...`;
        this.statusBarItem.show();
    }

    getTreeItem(element: ClassTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ClassTreeItem): Thenable<ClassTreeItem[]> {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No PHP files in empty workspace');
            return Promise.resolve([]);
        }

        if (!element) {
            return this.getClasses();
        } else {
            return Promise.resolve([]);
        }
    }

    private getClasses(): Thenable<ClassTreeItem[]> {
        return new Promise((resolve) => {
            index(this.workspaceRoot).then((classes) => {
                this.classes = classes;

                const treeItems: ClassTreeItem[] = this.classes.map((classEntity) => {
                    return new ClassTreeItem(classEntity, vscode.TreeItemCollapsibleState.Collapsed);
                });
                this.statusBarItem.text = `$(check) Indexed ${this.classes.length} classes`;
                resolve(treeItems);
            });
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