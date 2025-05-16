import * as vscode from 'vscode';
import { PhpDocWikiTreeProvider } from './tree-provider';
import { index } from './parser';

function refresh(treeProvider: PhpDocWikiTreeProvider, statusBarItem: vscode.StatusBarItem): void {
	const rootPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
	if (!rootPath) {
		console.error('No workspace folder found.');
		vscode.window.showErrorMessage('No workspace folder found.');
		return;
	}

	statusBarItem.text = `$(sync~spin) PhpDocWiki indexing...`;
	statusBarItem.command = undefined;
	statusBarItem.tooltip = 'Indexing...';
    statusBarItem.show();

	index(rootPath).then(classes => {
        statusBarItem.text = `$(check) PhpDocWiki indexed ${classes.length} classes`;
		statusBarItem.command = 'phpdocwiki.refresh';
		statusBarItem.tooltip = 'Click to refresh the index';
		treeProvider.updateClasses(classes);
	});
}

export function activate(context: vscode.ExtensionContext) {
	const provider = new PhpDocWikiTreeProvider();
	const disposable = vscode.window.registerTreeDataProvider('phpdocwiki.explorer', provider);
	const treeView = vscode.window.createTreeView('phpdocwiki.explorer', {
		treeDataProvider: provider,
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(treeView);

	const statusBarItem: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	context.subscriptions.push(
		vscode.commands.registerCommand('phpdocwiki.refresh', () => {
			refresh(provider, statusBarItem);
		}
	));
	context.subscriptions.push(statusBarItem);

	vscode.commands.executeCommand('phpdocwiki.refresh');
}

// This method is called when your extension is deactivated
export function deactivate() {}
