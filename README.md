![WaterFlaw](./banner.png)

# WaterFlaw

**Progetto di Economia Aziendale · Corso di Laurea in Informatica, Università della Calabria**

WaterFlaw è una simulazione di impresa sviluppata da Francesco Corti, Diell Guido, Devid Carpino e Leonardo Amoroso. L'elaborato esamina la costituzione di una società, il mercato delle reti idriche, l'organizzazione e la sostenibilità economica del servizio. Il sito e la demo mostrano l'idea di prodotto; non rappresentano una piattaforma già in esercizio.

**Dati per decidere dove intervenire.** WaterFlaw propone di confrontare le misure raccolte in punti diversi di una rete idrica per segnalare i tratti che meritano un'ispezione. Il servizio previsto combina misuratori, installazione, piattaforma web e assistenza.

[Elaborato (PDF)](./WaterFlaw_FINAL.pdf) · [Codice del sito](./index.html) · [Codice della demo](./demo/)

## Come funzionerebbe il software

La rete è modellata come un grafo: i **nodi** sono punti di misura o collettori; gli **archi** sono i tratti di tubazione. Ogni lettura di portata è associata a un sensore e a un intervallo temporale. La pressione, quando disponibile, aggiunge contesto all'analisi.

```text
Misuratori → serie temporali → grafo della rete → confronto dei flussi
                                              ↓
                            tratti da verificare → interventi
```

Le letture verrebbero allineate in finestre temporali. Per un collettore, il confronto previsto è:

```text
scarto(t) = portata_in(t) − somma(portate_out_i(t)) − prelievi_autorizzati(t)
```

Il software confronterebbe lo scarto con una soglia che tiene conto dell'incertezza dei misuratori e della persistenza nel tempo. Variazioni di pressione, consumi e condizioni della rete aiuterebbero a interpretare il risultato. Una segnalazione indica una priorità di controllo; la verifica della causa resta al gestore.

La piattaforma prevista comprende tre funzioni:

| Funzione | Scopo |
| --- | --- |
| **Network Builder** | Rappresentare la topologia e collegare i punti di misura ai tratti. |
| **Leak Confidence** | Ordinare i tratti da controllare in base alle misure disponibili e alla persistenza delle anomalie. |
| **Next Sensor** | Suggerire dove una nuova misura migliorerebbe la copertura della rete. |

## Cosa è disponibile

Il sito è realizzato con HTML, CSS e JavaScript senza backend o dipendenze esterne. La demo usa **dati simulati** e permette di passare tra scenari regolari e di possibile perdita, consultare grafici temporali, selezionare i nodi della rete e vedere uno storico di interventi dimostrativo. Non acquisisce letture da sensori reali e non fornisce diagnosi operative.

Per avviarlo in locale dalla radice del progetto:

```bash
python3 -m http.server 8000
```

Il sito sarà disponibile su `http://localhost:8000/` e la demo su `http://localhost:8000/demo/`. La radice contiene `index.html`, quindi può essere scelta come sorgente di [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) senza una fase di compilazione.

## File principali

```text
index.html, style.css, script.js  Sito
demo/                             Demo interattiva
assets/                           Logo e fotogrammi del sensore
privacy.html, cookie.html         Informative del sito
WaterFlaw_FINAL.pdf               Elaborato finale
banner.png                        Immagine di apertura del README
```

## Licenza

Il progetto adotta la [licenza MIT](./LICENSE) già presente nel repository. Le fonti statistiche e commerciali citate nell'elaborato appartengono ai rispettivi titolari.
