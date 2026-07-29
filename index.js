const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');

const app = express();
let pairingCode = "";
// 👇 CHANGE THIS TO YOUR REAL COUNTRY CODE + PHONE NUMBER (NO SPACES OR PLUS SIGNS) 👇
const MY_NUMBER = "‎⁨‪+44 7856 010438‬⁩"; 

app.get('/', (req, res) => {
    if (pairingCode) {
        // FIXED: This line correctly formats your unique setup code into a variable
        const cleanCode = pairingCode.replace('-', '');
        const waLink = `https://wa.me{cleanCode}`;
        
        res.send(`
            <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f0f2f5;} .btn{display:inline-block;padding:20px 40px;background:#25D366;color:white;text-decoration:none;font-size:24px;font-weight:bold;border-radius:50px;box-shadow:0 4px 15px rgba(37,211,102,0.4);}</style>
            <h1>WhatsApp Connection Link</h1>
            <p style="font-size:18px; color:#555;">Tap the green button below to link your device instantly:</p>
            <a href="${waLink}" target="_blank" class="btn">👉 CLICK TO LINK WHATSAPP</a>
            <p style="margin-top:20px; font-weight:bold; font-size:20px; color:#333;">Backup Manual Code: ${pairingCode}</p>
        `);
    } else {
        res.send('<h1>Bot Status: Active and Linked!</h1>');
    }
});

app.listen(process.env.PORT || 3000);

async function startBot() {
    // Unique folder name to reset any broken session states
    const { state, saveCreds } = await useMultiFileAuthState('auth_session_direct_fixed_v3');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(MY_NUMBER);
                pairingCode = code.match(/.{1,4}/g).join('-'); 
                console.log(`Link generated for code: ${pairingCode}`);
            } catch (err) {
                console.log('Error fetching pairing code:', err);
            }
        }, 3000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'close') {
            startBot();
        } else if (connection === 'open') {
            pairingCode = "";
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


