import * as vscode from 'vscode';
import { Class } from './symbols';
import createWikiHTML from './wiki';
import { PhpDocWikiTreeProvider } from './tree-provider';

// const renderWiki = (classes: Class[]): void => {
// 	const panel = vscode.window.createWebviewPanel(
// 		'phpWiki',
// 		'PHP Wiki',
// 		vscode.ViewColumn.One,
// 		{}
// 	);
// 	const wikiHTML = createWikiHTML(classes);
// 	panel.webview.html = wikiHTML;
// };

export function activate(context: vscode.ExtensionContext) {
	const rootPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
	if (!rootPath) {
		console.error('No workspace folder found.');
		vscode.window.showErrorMessage('No workspace folder found.');
		return;
	}

	const provider = new PhpDocWikiTreeProvider(rootPath);
	const disposable = vscode.window.registerTreeDataProvider('phpdocwiki.explorer', provider);
	const treeView = vscode.window.createTreeView('phpdocwiki.explorer', {
		treeDataProvider: provider,
	});
	context.subscriptions.push(disposable);
	context.subscriptions.push(treeView);
}

// This method is called when your extension is deactivated
export function deactivate() {}
