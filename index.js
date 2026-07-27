 const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');

// Bypasses Render's port requirements
const app = express();
app.get('/', (req, res) => res.send('Bot is active!'));
app.listen(process.env.PORT || 3000);

async function startBot() {
    // Saves your login file cleanly on Render
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false // We use qrcode-terminal manually below for stability
    });

    // Generates the setup QR code in Render Logs
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('--- SCAN THIS CODE WITH WHATSAPP ---');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            console.log('Connection closed, restarting...');
            startBot();
        } else if (connection === 'open') {
            console.log('Your WhatsApp Game Bot is live!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Listens for the trigger words and replies with your link
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        // Extracts the incoming text message
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (text.toLowerCase() === 'play game') {
            const jid = msg.key.remoteJid;
            await sock.sendMessage(jid, { 
                text: '🎮 Load the shooter game here:\nhttp://logwgiem-oss.github.io/Online-Shooter/n' 
            });
        }
    });
}

startBot();
