const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');
const qrImage = require('qr-image');

const app = express();
let currentQR = "";

app.get('/', (req, res) => {
    if (currentQR) {
        const codeBuffer = qrImage.imageSync(currentQR, { type: 'png' });
        const base64Image = codeBuffer.toString('base64');
        res.send(`
            <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f0f2f5;}</style>
            <h1>Scan This Code with WhatsApp</h1>
            <img src="data:image/png;base64,${base64Image}" style="width:300px; height:300px; border: 10px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
            <p style="margin-top:20px; font-size:18px; color:#555;">Go to WhatsApp > Linked Devices > Link a Device</p>
            <script>setTimeout(() => { location.reload(); }, 15000);</script>
        `);
    } else {
        res.send('<h1>Bot Status: Active and Linked!</h1>');
    }
});

app.listen(process.env.PORT || 3000);

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_session_qr_native_v1');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        if (qr) currentQR = qr;
        if (connection === 'close') startBot();
        if (connection === 'open') {
            currentQR = "";
            console.log('✅ Connected!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Listens for triggers
    sock.ev.on('messages.upsert', async m => {
        if (!m.messages || m.messages.length === 0) return;
        const msg = m.messages[0]; 
        if (!msg.message) return;
        
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase().trim();
        const jid = msg.key.remoteJid;

        // Choice 1: play game
        if (text === 'play game') {
            await sock.sendMessage(jid, { 
                text: '```🎮 ONLINE SHOOTER LAUNCHER:```\nhttp://logwgiem-oss.github.io/Online-Shooter/' 
            });
        } 
        // Choice 2: show games
        else if (text === 'show games') {
            await sock.sendMessage(jid, { 
                text: '```🕹️ MY GDEVELOP PROFILE GAMES:```\nhttps://gd.games/lowgiem' 
            });
        }
    });
}

startBot();



