import { Class } from "./symbols";

export default function createWikiHTML(classes: Class[]): string {
    const wikiHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PHP Wiki</title>
        <style>
            body { font-family: Arial, sans-serif; background: #333333; }
            h1 { color: #dbdbdb; }
            h2 { color: #ffffff; }
            h3 { color: #ffffff; }
            p { color: #dbdbdb; }
            pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
            code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
            .class { margin-bottom: 20px; }
            .method { margin-left: 20px; }
            .parameter { margin-left: 40px; }
            .description { margin-left: 20px; }
        </style>
    </head>

    <body>
        <h1>PHP Wiki</h1>
        ${classes.map(classObj => `
            <div class="class">
                <h2>${classObj.name}</h2>
                <p class="description">${classObj.description || 'No description available.'}</p>
                ${classObj.methods.map(method => `
                    <div class="method">
                        <h3>${method.name}</h3>
                        <p class="description">${method.description || 'No description available.'}</p>
                        ${method.parameters.map(param => `
                            <div class="parameter">
                                <strong>${param.name}</strong>: ${param.type || 'No type specified.'} - ${param.description || 'No description available.'}
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        `).join('')}
    </body>
    </html>
    `;
    return wikiHTML;
}