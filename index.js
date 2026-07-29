const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');

async function startBot() {
    // Brand new folder ID to reset all errors
    const { state, saveCreds } = await useMultiFileAuthState('auth_session_final_code_v9');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    // Requests the code and prints it directly in the Render logs
    setTimeout(async () => {
        try {
            // Make sure your phone number is typed below inside the quotes!
            let code = await sock.requestPairingCode('‎⁨‪+44 7856 010438‬⁩');
            let formattedCode = code.match(/.{1,4}/g).join('-'); 
            console.log('\n======================================');
            console.log(`👉 YOUR WHATSAPP CODE IS: ${formattedCode} 👈`);
            console.log('======================================\n');
        } catch (err) {
            console.log('Error requesting pairing code:', err);
        }
    }, 5000);

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'close') {
            startBot();
        } else if (connection === 'open') {
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

