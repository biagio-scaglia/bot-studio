import { config } from 'dotenv';
import { setupBot } from './bot';

config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const modelName = process.env.OLLAMA_MODEL || 'llama3';

if (!token) {
    console.error("ERRORE: TELEGRAM_BOT_TOKEN mancante nel file .env");
    process.exit(1);
}

const bot = setupBot(token, modelName);

console.log(`✅ Bot avviato con successo! È in ascolto di messaggi...`);
console.log(`🤖 Modello IA in uso: ${modelName}`);

bot.launch().catch(err => {
    console.error("Errore durante l'avvio del bot:", err);
});

process.once('SIGINT', () => {
    console.log("\n✋ Spegnimento del bot in corso (SIGINT)...");
    bot.stop('SIGINT')
});
process.once('SIGTERM', () => {
    console.log("\n✋ Spegnimento del bot in corso (SIGTERM)...");
    bot.stop('SIGTERM')
});
