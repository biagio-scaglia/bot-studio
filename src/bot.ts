import { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import ollama from 'ollama';

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

AMBITO:
- Parla esclusivamente di programmazione, sviluppo software, architettura, tool, sicurezza e tecnologia.
- Se la richiesta esce da questo ambito, riportala sul tecnico o rifiuta.

MENTALITÀ:
- Pensa come qualcuno che lavora in team: scrivi codice che un altro dev può leggere tra 6 mesi senza bestemmiare.
- Preferisci soluzioni semplici ma solide rispetto a soluzioni “fighe” ma fragili.
`;

export function setupBot(botToken: string, modelName: string) {
    const bot = new Telegraf(botToken);
    const contextMap = new Map<number, { role: string, content: string }[]>();

    bot.start((ctx) => {
        const userId = ctx.from.id;
        ctx.reply(`Benvenuto! 👨‍💻\nSono il tuo assistente per la programmazione basato su ${modelName}.\nIl tuo Telegram ID è: \`${userId}\`\nChiedimi qualsiasi cosa sul codice!`, { parse_mode: 'Markdown' });
    });

    bot.command('reset', (ctx) => {
        const userId = ctx.from.id;
        contextMap.delete(userId);
        ctx.reply("Memoria della conversazione resettata. Partiamo da zero!");
    });

    bot.on(['message', 'channel_post'], async (ctx: Context) => {
        let userMessage = '';
        if (ctx.message && 'text' in ctx.message) {
            userMessage = ctx.message.text;
        } else if (ctx.channelPost && 'text' in ctx.channelPost) {
            userMessage = ctx.channelPost.text;
        }

        if (!userMessage) return;

        const contextId = ctx.chat?.id || ctx.from?.id || 1;

        console.log(`\n📥 [Messaggio Ricevuto] Da: ${contextId} | Testo captato: "${userMessage}"`);
        console.log(`⏳ Sto generando la risposta con Ollama...`);

        try {
            await ctx.sendChatAction('typing');
        } catch (e) {
            console.error("Impossibile inviare la chat action", e);
        }

        let history = contextMap.get(contextId) || [];
        if (history.length === 0) {
            history.push({ role: 'system', content: SYSTEM_PROMPT.trim() });
        }

        history.push({ role: 'user', content: userMessage });

        try {
            const typingInterval = setInterval(() => {
                ctx.sendChatAction('typing').catch(() => { });
            }, 3500);

            const response = await ollama.chat({
                model: modelName,
                messages: history,
            });

            clearInterval(typingInterval);

            const aiResponse = response.message.content;
            console.log(`📤 [Risposta Pronta] Lunga ${aiResponse.length} caratteri. Invio su Telegram...`);
            history.push({ role: 'assistant', content: aiResponse });

            const decoratedResponse = `[\u200B](https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop)🤖 *Ollama Coder Assistant*\n➖➖➖➖➖➖➖➖➖➖➖➖\n${aiResponse}\n➖➖➖➖➖➖➖➖➖➖➖➖\n🔗 *Risorse:* [Ollama](https://ollama.com/) | [Telegraf](https://telegraf.js.org/) | [Progetto Bot](https://github.com/biagio-scaglia/bot-studio)`;
            
            if (history.length > 20) {
                history.splice(1, 2);
            }
            contextMap.set(contextId, history);

            try {
                await ctx.reply(decoratedResponse, { parse_mode: 'Markdown' });
            } catch (mdError) {
                console.log("⚠️ Errore di formattazione Markdown da Telegram, invio come testo normale:", mdError);
                await ctx.reply(`🤖 Ollama Coder Assistant\n➖➖➖➖➖➖➖➖➖➖➖➖\n${aiResponse}\n➖➖➖➖➖➖➖➖➖➖➖➖\n🔗 Risorse: https://ollama.com/ | https://github.com/biagio-scaglia/bot-studio`);
            }
        } catch (error: any) {
            console.error("Errore Ollama:", error);

            let errorMessage = "❌ C'è stato un errore nel comunicare con Llama 3.";
            if (error.cause?.code === 'ECONNREFUSED') {
                errorMessage += "\n\nSembra che **Ollama non sia in esecuzione** nel tuo PC. Assicurati di avviarlo e riprova!";
            } else if (error.status_code === 404) {
                errorMessage += `\n\nModello '${modelName}' non trovato. Prova ad aprire il terminale ed eseguire \`ollama run ${modelName}\`.`;
            }

            await ctx.reply(errorMessage, { parse_mode: 'Markdown' });
            history.pop();
        }
    });

    return bot;
}
