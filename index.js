const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');
const qrImage = require('qr-image'); // Built-in image encoder tools

const app = express();
let currentQR = "";

// Serves the QR page layout natively without relying on outside web APIs
app.get('/', (req, res) => {
    if (currentQR) {
        // Encodes the dynamic code into a text string image block natively
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
        if (qr) {
            currentQR = qr;
        }
        if (connection === 'close') {
            startBot();
        } else if (connection === 'open') {
            currentQR = "";
            console.log('✅ Connected!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages;
        if (!msg.message || msg.key.fromMe) return;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (text.toLowerCase() === 'play game') {
            const jid = msg.key.remoteJid;
            await sock.sendMessage(jid, { 
                text: '🎮 Load the shooter game here:\nhttp://logwgiem-oss.github.io/Online-Shooter/' 
            });
        }
    });
}

startBot();
