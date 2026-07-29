const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');

const app = express();
let currentQR = "";

// Serves a dynamic webpage layout that displays the live connection QR code
app.get('/', (req, res) => {
    if (currentQR) {
        res.send(`
            <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f0f2f5;}</style>
            <h1>Scan This Code with WhatsApp</h1>
            <img src="https://qrserver.com{encodeURIComponent(currentQR)}" />
            <p style="margin-top:20px; font-size:18px; color:#555;">Go to WhatsApp > Linked Devices > Link a Device</p>
            <script>setTimeout(() => { location.reload(); }, 10000);</script>
        `);
    } else {
        res.send('<h1>Bot Status: Active and Linked!</h1>');
    }
});

app.listen(process.env.PORT || 3000);

async function startBot() {
    // Unique version name to completely destroy all old broken cache links
    const { state, saveCreds } = await useMultiFileAuthState('auth_session_qr_fresh_v9');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        // Captures WhatsApp's security QR codes dynamically on rotation
        if (qr) {
            currentQR = qr;
            console.log('New login QR Code broadcasted.');
        }
        if (connection === 'close') {
            startBot();
        } else if (connection === 'open') {
            currentQR = "";
            console.log('✅ Connected! Bot is running 24/7!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0]; // Captures the array object cleanly
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



