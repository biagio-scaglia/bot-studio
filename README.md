# Telegram Programming Bot (Local Ollama)

Un potente bot Telegram privato progettato per assistere programmatori, testato e interamente basato su **Llama 3** (attraverso Ollama) eseguito in locale sul tuo PC.

Nessuna chiamata ad API esterne a pagamento, zero telemetria e massimo controllo: il bot "vive" nel tuo terminale.

## Funzionalità
- **Risposte "Umane"**: Modello istruito come Pair Programmer Senior. Va dritto al punto, niente frasi di circostanza ("In sintesi", "Spero sia di aiuto").
- **Memoria di Sessione**: Ricorda i messaggi precedenti e la contestualità (fino a ~20 interazioni in cache per preservare la RAM).
- **Fallback Markdown**: Gestione robusta della formattazione. Se Telegram rifiuta una risposta perché la struttura Markdown del modello è incompatibile, il bot re-invia automaticamente il testo in formato standard scampando al crash.
- **Supporto Canali**: Risponde sia in chat privata che come Amministratore all'interno dei Canali Telegram (`channel_post`).
- **Real-Time Logs**: Feedback terminale elegante per visualizzare richieste captate e tempo di calcolo.

## Prerequisiti
1. **Node.js** (v18+)
2. **Ollama** installato ed in esecuzione sulla porta `11434` locale.
3. Il modello (es. `llama3`) scaricato tramite Ollama (`ollama pull llama3`).

## Setup

1. Crea il bot tramite [@BotFather](https://t.me/BotFather) su Telegram per ottenere il **Token**.
2. Clonare o scaricare questo progetto e installare le dipendenze:
   ```bash
   npm install
   ```
3. Creare un file `.env` nella root del progetto:
   ```env
   TELEGRAM_BOT_TOKEN="il_tuo_token_qui"
   OLLAMA_MODEL="llama3"
   ```

## Avvio
Per mettere il bot in ascolto, apri il terminale ed esegui:
```bash
npm run dev
```

Il bot stamperà `✅ Bot avviato con successo!` e rimarrà in attesa.
Per fermarlo in totale sicurezza (spegnimento grazioso), premi **Ctrl + C** nel terminale.

## Sicurezza
Attualmente chiunque cerchi l'username del tuo bot potrebbe teoricamente inviargli domande.
Puoi limitare l'uso a determinati utenti o canali inserendo un controllo sull'ID in `src/bot.ts`.

---
*Progetto nato per automatizzare un ecosistema di studio personale 100% locale e privato.*
