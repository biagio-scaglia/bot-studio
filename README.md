# Telegram Programming Bot (Local Ollama)

Un potente bot Telegram privato progettato per assistere programmatori, testato e interamente basato su **Llama 3** (attraverso Ollama) eseguito in locale sul tuo PC.

Nessuna chiamata ad API esterne a pagamento, zero telemetria e massimo controllo: il bot "vive" nel tuo terminale ed è esteticamente curato.

## Funzionalità
- **Risposte "Umane"**: Modello istruito come Pair Programmer Senior. Va dritto al punto, niente frasi di circostanza. Al termine della risposta fornisce sempre riferimenti o pratiche utili in base all'argomento affrontato.
- **Memoria di Sessione Intelligente**: Ricorda i messaggi precedenti e la contestualità (fino a ~20/30 interazioni in cache salvate su `history.json` per riprendere dal punto in cui avevi interrotto).
- **Lettura dei File in Memoria**: Tramite il comando `/read script.js` puoi inviargli l'intero contenuto di un tuo file in memoria cosicché possa analizzarlo per te e suggerirti modifiche senza dover copiare/incollare blocchi di codice su Telegram. 
- **Estetica e Formattazione Elegante**: Le risposte del bot sono "brandizzate" e racchiuse in header e footer grafici che spezzano bene con l'input utente.
- **Fallback Markdown Automatico**: Gestione robusta della formattazione. Se Telegram rifiuta una risposta perché la struttura Markdown generata dal modello è troppo caotica o imprecisa, il bot re-invia il testo in formato raw sfuggendo ai fastidiosi crash dell'app.
- **Supporto Gruppi e Canali**: Risponde alla grande sia in chat di gruppo che come amministratore all'interno dei canali (`channel_post`).

## Prerequisiti
1. **Node.js** (v18+)
2. **Ollama** installato ed in esecuzione (di default sulla porta `11434`).
3. Il modello (es. `llama3`) scaricato tramite Ollama (`ollama pull llama3`).

## Setup

1. Crea il bot tramite [@BotFather](https://t.me/BotFather) su Telegram per ottenere il **Token**.
2. Clona o scarica questo progetto e installa le dipendenze:
   ```bash
   npm install
   ```
3. Crea un file `.env` nella root del progetto:
   ```env
   TELEGRAM_BOT_TOKEN="il_tuo_token_qui"
   OLLAMA_MODEL="llama3"
   ```

## Avvio
Per mettere il bot in ascolto, dal tuo terminale usa:
```bash
npm run dev
```

Il bot stamperà `✅ Bot avviato con successo!` indicando il modello agganciato e rimarrà in ascolto.
Per fermarlo chiudendo tutto in totale sicurezza, premi **Ctrl + C** nel terminale.

## Comandi Disponibili (da Telegram)
- `/reset` - Svuota completamente la memoria contestuale del bot (molto utile se si cambia del tutto l'argomento e non si vuole confondere l'IA).
- `/read percorso/file.ts` - Legge un file dal tuo progetto in locale e lo aggiunge tra i messaggi da far gestire all'IA. (Es. `/read src/bot.ts`).

## Sicurezza
Trattandosi di un tuo ambiente, ci sono limiti preventivi per impedire l'esportazione di file immensi tramite il comando di interazione. Puoi in ogni caso limitare l'uso a determinati utenti o canali inserendo logiche sull'ID utente in `src/bot.ts` per evitare che qualche esterno sfrutti la tua macchina se individua l'username del tuo bot.

---
*Progetto nato per automatizzare un ecosistema di studio e sviluppo personale 100% locale.*
