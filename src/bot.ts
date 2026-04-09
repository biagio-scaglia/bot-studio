import { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import ollama from 'ollama';
import fs from 'fs';
import path from 'path';

const SYSTEM_PROMPT = `
Sei un programmatore senior con esperienza reale in produzione. Non sei un assistente, sei uno sviluppatore che risponde a un altro sviluppatore.

STILE DI RISPOSTA:
- Scrivi sempre e solo in italiano.
- Tono diretto, naturale, umano. Niente frasi da AI, niente riempitivi inutili.
- Vai dritto al punto: prima la soluzione, poi (se serve) una spiegazione breve e mirata.
- Se qualcosa è una cattiva idea, dillo chiaramente e proponi un'alternativa migliore.

COMPORTAMENTO TECNICO:
- Ragiona come in una code review: chiarezza, performance, scalabilità e manutenibilità prima di tutto.
- Non dare mai soluzioni superficiali o “hacky” senza specificarlo.
- Se esistono più approcci, mostra il migliore e accenna rapidamente agli altri solo se rilevanti.
- Scrivi codice pulito, moderno e pronto per produzione. Niente commenti inutili.
- Evita ripetizioni e boilerplate quando non servono.

FORMATTAZIONE:
- Niente intestazioni Markdown (#, ##, ###).
- Testo semplice per spiegazioni.
- Usa blocchi di codice (\`\`\`) solo per il codice.
- Mantieni le risposte compatte ma complete.
- **IMPORTANTE**: Alla fine di ogni risposta, inserisci sempre obbligatoriamente una voce intitolata "🔗 *Risorse pratiche:*" fornendo 1 o 2 link in formato Markdown alla documentazione ufficiale inerente all'argomento o codice di cui avete appena discusso.

AMBITO:
- Parla esclusivamente di programmazione, sviluppo software, architettura, tool, sicurezza e tecnologia.
- Se la richiesta esce da questo ambito, riportala sul tecnico o rifiuta.

MENTALITÀ:
- Pensa come qualcuno che lavora in team: scrivi codice che un altro dev può leggere tra 6 mesi senza bestemmiare.
- Preferisci soluzioni semplici ma solide rispetto a soluzioni “fighe” ma fragili.
`;

const HISTORY_FILE = path.join(process.cwd(), 'history.json');

function loadHistory(): Map<number, { role: string, content: string }[]> {
    if (fs.existsSync(HISTORY_FILE)) {
        try {
            return new Map(JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8')));
        } catch (e) {}
    }
    return new Map<number, { role: string, content: string }[]>();
}

function saveHistory(map: Map<number, { role: string, content: string }[]>) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(Array.from(map.entries())));
}

async function sendDecoratedMessage(ctx: Context, aiResponse: string) {
    const headerUrl = `[\u200B](https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop)`;
    const header = `${headerUrl}🐉 *il biagigio*\n➖➖➖➖➖➖➖➖➖➖➖➖\n`;
    const footer = `\n➖➖➖➖➖➖➖➖➖➖➖➖\n💻 [Progetto Bot su GitHub](https://github.com/biagio-scaglia/bot-studio)`;
    
    const fullText = header + aiResponse + footer;
    const MAX_LENGTH = 4000;

    if (fullText.length <= MAX_LENGTH) {
        try { 
            await ctx.reply(fullText, { parse_mode: 'Markdown' }); 
        } catch { 
            await ctx.reply(`🐉 il biagigio\n➖➖➖➖➖➖➖➖➖➖➖➖\n${aiResponse}\n➖➖➖➖➖➖➖➖➖➖➖➖\n💻 https://github.com/biagio-scaglia/bot-studio`); 
        }
        return;
    }

    const chunks = aiResponse.match(/[\s\S]{1,4000}/g) || [];
    for (let i = 0; i < chunks.length; i++) {
        let chunkText = chunks[i];
        if (i === 0) chunkText = header + chunkText;
        if (i === chunks.length - 1) chunkText = chunkText + footer;
        
        try { 
            await ctx.reply(chunkText, { parse_mode: 'Markdown' }); 
        } catch { 
            await ctx.reply(chunkText); 
        }
    }
}

export function setupBot(botToken: string, modelName: string) {
    const bot = new Telegraf(botToken);
    const contextMap = loadHistory();

    bot.start((ctx) => {
        const userId = ctx.from.id;
        ctx.reply(`Benvenuto! 👨‍💻\nSono il tuo assistente per la programmazione basato su ${modelName}.\nIl tuo Telegram ID è: \`${userId}\`\nChiedimi qualsiasi cosa sul codice!`, { parse_mode: 'Markdown' });
    });

    bot.command('reset', (ctx) => {
        const userId = ctx.from.id;
        contextMap.delete(userId);
        saveHistory(contextMap);
        ctx.reply("Memoria della conversazione resettata. Partiamo da zero!");
    });

    bot.command('read', (ctx) => {
        if (!ctx.message || !('text' in ctx.message)) return;
        const text = ctx.message.text.replace('/read', '').trim();
        if (!text) {
             ctx.reply('Specifica il percorso del file. Esempio: /read src/index.ts');
             return;
        }
        
        const filePath = path.resolve(process.cwd(), text);
        try {
            if (!fs.existsSync(filePath)) {
                ctx.reply(`⚠️ Il file indicato non esiste: ${text}`);
                return;
            }
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                ctx.reply(`📂 Il percorso indica una cartella, specifica l'indirizzo di un file.`);
                return;
            }
            if (stat.size > 100000) { // Limite di 100KB per evitare un contesto eccessivo e crash
                ctx.reply(`⛔ Il file è troppo grande per essere elaborato e inserito nel contesto.`);
                return;
            }

            const content = fs.readFileSync(filePath, 'utf-8');
            const contextId = ctx.chat?.id || ctx.from?.id || 1;
            let history = contextMap.get(contextId) || [];
            
            if (history.length === 0) {
                history.push({ role: 'system', content: SYSTEM_PROMPT.trim() });
            }
            
            history.push({ role: 'user', content: `Ecco il file ${text}:\n\n\`\`\`\n${content}\n\`\`\`` });
            history.push({ role: 'assistant', content: `Ho letto correttamente ${text}.` });
            
            contextMap.set(contextId, history);
            saveHistory(contextMap);
            ctx.reply(`File *${text}* caricato in memoria! (Aggiunte ${content.length} battute al contesto)`, { parse_mode: 'Markdown' });
        } catch (e: any) {
             ctx.reply(`Impossibile leggere il file: ${e.message}`);
        }
    });

    bot.on(['message', 'channel_post'], async (ctx: Context) => {
        let userMessage = '';
        if (ctx.message && 'text' in ctx.message && !ctx.message.text.startsWith('/')) {
            userMessage = ctx.message.text;
        } else if (ctx.channelPost && 'text' in ctx.channelPost && !ctx.channelPost.text.startsWith('/')) {
            userMessage = ctx.channelPost.text;
        }

        if (!userMessage) return;

        const contextId = ctx.chat?.id || ctx.from?.id || 1;
        
        try {
            await ctx.sendChatAction('typing');
        } catch (e) {}

        let history = contextMap.get(contextId) || [];
        if (history.length === 0) {
            history.push({ role: 'system', content: SYSTEM_PROMPT.trim() });
        }

        history.push({ role: 'user', content: userMessage });

        let typingInterval: NodeJS.Timeout | null = null;
        try {
            typingInterval = setInterval(() => {
                ctx.sendChatAction('typing').catch(() => { });
            }, 3500);

            const response = await ollama.chat({
                model: modelName,
                messages: history,
            });

            clearInterval(typingInterval);
            typingInterval = null;

            const aiResponse = response.message.content;
            history.push({ role: 'assistant', content: aiResponse });

            if (history.length > 30) {
                history.splice(1, 2); // Rimuoviamo i messaggi vecchi mantenendo il SYSTEM_PROMPT
            }
            contextMap.set(contextId, history);
            saveHistory(contextMap);

            await sendDecoratedMessage(ctx, aiResponse);
            
        } catch (error: any) {
            if (typingInterval) clearInterval(typingInterval);
            let errorMessage = "❌ C'è stato un errore nel comunicare con Llama 3.";
            if (error.cause?.code === 'ECONNREFUSED') {
                errorMessage += "\n\nSembra che Llama non sia in esecuzione.";
            }
            await ctx.reply(errorMessage);
            history.pop();
        }
    });

    return bot;
}
