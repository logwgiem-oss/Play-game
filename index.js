const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');

const app = express();
let currentQR = "";

app.get('/', (req, res) => {
    if (currentQR) {
        res.send(`
            <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f0f2f5;}</style>
            <h1>Scan This Code with WhatsApp</h1>
            <img src="https://qrserver.com{encodeURIComponent(currentQR)}" />
            <p>Go to WhatsApp > Linked Devices > Link a Device</p>
        `);
    } else {
        res.send('<h1>Bot Status: Active and Linked!</h1>');
    }
});

app.listen(process.env.PORT || 3000);

async function startBot() {
    // This folder name is uniquely generated to break the ghost connection loop completely
    const { state, saveCreds } = await useMultiFileAuthState('auth_session_force_reset_v5');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        if (qr) {
            currentQR = qr;
            console.log('\n👉 FRESH QR CODE GENERATED ON YOUR LIVE LINK! 👈\n');
        }
        if (connection === 'close') {
            startBot();
        } else if (connection === 'open') {
            currentQR = "";
            console.log('✅ Connected! Your WhatsApp Game Bot is running 24/7!');
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
