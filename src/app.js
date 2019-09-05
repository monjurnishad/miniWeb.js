// app.js
const webby = require('./webby.js');
const app = new webby.App();
const path = require('path');

app.use(webby.static(path.join(__dirname, '..', 'public')));

app.get('/', function(req, res) {

    const htmlStr = 
    `<!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8"> 
    <link rel="stylesheet" type="text/css" href="/css/style.css">
    </head>

    <body>

    <div class= "box">
    <a href="/gallery" class="button">Let me see some gorgeous geckos!</a>
    </div>

    </body>

    </html>`

    res.send(htmlStr);
});

app.get('/gallery', function(req, res) {
    const num = Math.floor(Math.random() * 4) + 1;
    let imgStr = '';

    for(let i = 1; i <= num; i++){
        imgStr += `<img src="/img/animal${i}.jpg" height="200" width="200">`;
    }

    const htmlStr = 
    `<!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8"> 
    <link rel="stylesheet" type="text/css" href="/css/style.css">
    </head>

    
    <body>
    <div class="box">
        <h1 > Showing ${num} gecko(s) <h1>
        ${imgStr}
    </div>
    </body>

    </html>`

    res.send(htmlStr);
});

app.get('/pics', function(req, res) {
    res.status(308).headers['Location'] = '/gallery';
    res.send(res.statusLineToString());
});

app.listen(3000, '127.0.0.1');
