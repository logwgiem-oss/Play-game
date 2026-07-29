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
    // Unique session ID name to guarantee a clean connection state
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

    // Listens for incoming texts from your friends or yourself
    sock.ev.on('messages.upsert', async m => {
        if (!m.messages || m.messages.length === 0) return;
        const msg = m.messages[0]; 
        
        if (!msg.message) return;
        
        // Correctly checks both standard text strings and extended text inputs
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (text.toLowerCase().trim() === 'play game') {
            const jid = msg.key.remoteJid;
            console.log(`Sending shooter launcher link to: ${jid}`);

            // Fires back your shooter game link automatically
            await sock.sendMessage(jid, { 
                text: '🎮 Load the shooter game here:\nhttp://logwgiem-oss.github.io/Online-Shooter/' 
            });
        }
    });
}

startBot();


