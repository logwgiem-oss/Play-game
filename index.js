const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');

const app = express();
let pairingCode = "";

app.get('/', (req, res) => {
    if (pairingCode) {
        res.send(`
            <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f0f2f5;}</style>
            <h1>Your WhatsApp Pairing Code</h1>
            <div style="font-size:42px; font-weight:bold; background:white; padding:20px; border-radius:10px; border:2px dashed #25D366; letter-spacing:4px;">
                ${pairingCode}
            </div>
            <p style="margin-top:20px; font-size:18px;">Go to WhatsApp > Linked Devices > Link with Phone Number Instead</p>
        `);
    } else {
        res.send('<h1>Bot Status: Active and Linked!</h1>');
    }
});

app.listen(process.env.PORT || 3000);

async function startBot() {
    // Unique session ID to clear old connection data completely
    const { state, saveCreds } = await useMultiFileAuthState('auth_session_number_link_v1');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    // Requests the text pairing code after the server boots up
    setTimeout(async () => {
        try {
            // 👇 CHANGE THE TEXT BELOW TO YOUR REAL COUNTRY CODE + PHONE NUMBER (NO SPACES OR PLUS SIGNS) 👇
            // Example: '447123456789' or '15551234567'
            let code = await sock.requestPairingCode('‎⁨‪+44 7856 010438‬⁩');
            pairingCode = code.match(/.{1,4}/g).join('-'); // Formats it to XXXX-XXXX
            console.log(`\n👉 PAIRING CODE GENERATED: ${pairingCode} 👈\n`);
        } catch (err) {
            console.log('Error requesting pairing code:', err);
        }
    }, 5000);

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'close') {
            startBot();
        } else if (connection === 'open') {
            pairingCode = "";
            console.log('✅ Connected! Your Bot is running 24/7!');
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
();
