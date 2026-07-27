const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Active'));
app.listen(process.env.PORT || 3000);

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', (qr) => {
    console.log('--- SCAN CODE ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot is active!');
});

client.on('message', async (msg) => {
    if (msg.body.toLowerCase() === 'play game') {
        await msg.reply('🎮 Load the shooter game here:\nhttp://logwgiem-oss.github.io/Online-Shooter/');
    }
});

client.initialize();
