import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem;

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

export function activate(context: vscode.ExtensionContext) {
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.text = 'Indexing PHP files...';
	statusBarItem.show();
	findPhpFiles()
		.then(files => {
			statusBarItem.text = `PHP Files: ${files.length}`;
			statusBarItem.tooltip = `Found ${files.length} PHP files for wiki`;
		});
}

// This method is called when your extension is deactivated
export function deactivate() {}
