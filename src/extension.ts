import * as vscode from 'vscode';
import { Class } from './symbols';
import createWikiHTML from './wiki';

const findPhpFiles: () => Promise<string[]> = () => {
	const phpFiles: string[] = [];
	const workspaceFolders = vscode.workspace.workspaceFolders;

	return new Promise<string[]>((resolve, reject) => {
		if (workspaceFolders) {
			const promises = workspaceFolders.map(folder => vscode.workspace.findFiles(
				new vscode.RelativePattern(folder, '**/*.php'),
				new vscode.RelativePattern(folder, '**/vendor/**')
			));

			Promise.all(promises)
				.then(groupedUris => {
					groupedUris.forEach(uris => {
						uris.forEach((uri) => {
							phpFiles.push(uri.fsPath);
						});
					});
					resolve(phpFiles);
				});
		} else {
			resolve(phpFiles);
		}
	});
};

const findAndCategoriseComments = (text: string): Array<Class> => {
	const commentRegex = /\/\*\*((?:\r?\n|.)*?)\*\/(?:\r?\n|\s)(.*)(?:\r?\n|\s)+[{=]/g;
	console.log('Text:', JSON.stringify(text));
	const comments = text.matchAll(commentRegex);
	const classes: Class[] = [];
	for (const comment of comments) {
		const commentText = comment[1];
		const symbolDefinition = comment[2].trim();
		console.log('Symbol Definition:', symbolDefinition);
		console.log('Comment Text:', commentText);
		if (symbolDefinition.startsWith('class')) {
			const className = symbolDefinition.match(/class\s+(\w+)/);
			if (className) {
				const classDescription = commentText.split('\n').map(line => line.replaceAll('*', '').trim()).join(' ');
				const classObj = new Class(className[1], classDescription);
				classes.push(classObj);
			}
		}
	}

	return classes;
};

const renderWiki = (classes: Class[]): void => {
	const panel = vscode.window.createWebviewPanel(
		'phpWiki',
		'PHP Wiki',
		vscode.ViewColumn.One,
		{}
	);
	const wikiHTML = createWikiHTML(classes);
	panel.webview.html = wikiHTML;
};

const startIndexing = async (statusBarItem: vscode.StatusBarItem): Promise<void> => {
	statusBarItem.text = 'Indexing PHP files...';
	statusBarItem.show();
	findPhpFiles()
		.then(files => {
			statusBarItem.text = `PHP Wiki Files: ${files.length}`;

			if (files.length > 0) {
				// find phpdoc comments in the files
				const classes: Class[] = [];
				const promises = files.map(file => 
					vscode.workspace.openTextDocument(vscode.Uri.file(file))
						.then(document => {
							const text = document.getText();
							const result = findAndCategoriseComments(text);
							classes.push(...result);
						})
				);
				Promise.all(promises).then(() => {
					console.log('Classes', classes);
					renderWiki(classes);
				});
			}
		});
};

export function activate(context: vscode.ExtensionContext) {
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.command = 'php-wiki.startIndexing';
	statusBarItem.tooltip = `Click to index PHP files`;
	startIndexing(statusBarItem);

	// Register the command to start indexing
	const disposable = vscode.commands.registerCommand('php-wiki.startIndexing', () => {
		startIndexing(statusBarItem);
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(statusBarItem);
}

// This method is called when your extension is deactivated
export function deactivate() {}
