const { OpenAI } = require('openai');
require('dotenv').config();

class OpenAiManager {
    constructor() {
        this.model = "gpt-4o";
        this.jsonModel = "gpt-4o";
        this.chatHistory = [];
        this.dbInfo = [];
        this.json = "";

        const API_KEY = process.env.OPENAI_API_KEY;
        if (!API_KEY) {
            console.error("No OPENAI_API_KEY");
            process.exit(1);
        }

        this.client = new OpenAI(API_KEY);
        this.startupSequence();
    }

    async chat(prompt = "") {
        if (!prompt) {
            console.log("Didn't receive input!");
            return;
        }

        this.chatHistory.push({ "role": "user", "content": prompt });

        console.log("Asking ChatGPT a question...");
        const completion = await this.client.chat.completions.create({
            model: this.model,
            messages: this.chatHistory
        });

        this.chatHistory.push({ "role": completion.choices[0].message.role, "content": completion.choices[0].message.content });

        const openaiAnswer = completion.choices[0].message.content;
        if (openaiAnswer.includes("Bedankt voor het bevestigen van de offerte.")) {
            console.log("Offerte wordt gemaakt...");
            const filename = new Date().toISOString().replace(/:/g, "-") + ".txt";
            this.json = this.convertToJson(openaiAnswer);
            // Write JSON to file
            // fs.writeFileSync(filename, this.json);
        }
        return openaiAnswer;
    }

    async convertToJson(openaiAnswer) {
        if (!openaiAnswer) {
            console.log("Didn't receive input!");
            return "No Input";
        }

        const conversionInstructions = [
            { "role": "system", "content": `
            Je bent een hulpvolle assistent die JSON teruggeeft.
            [1] Je geeft een factuur terug in JSON-formaat.
            [2] Je kan alleen een factuur maken van de informatie die jou al gegeven is.
            [3] Je geeft alleen de informatie terug waaruit waarvan we de prijs per m, m2, of stuk kunnen berekenen.
            [4] Voorbeeld: **Spatrand:** Mogelijk van 0 tot 150mm geef je niet terug.
            [5] Voorbeeld: **Spatrand:** 75mm geef je wel terug MET de prijs.
            [6] De materiaalsoort geef je altijd terug.
            [7] Geef altijd de totaal prijs terug.
            Voorbeeld van JSON structuur: 
                "Materiaal":
                    "Naam": " ",
                    "Hoeveelheid": " ",
                    "Prijs": " "
                "Spatrand":
                    "Breedte": " ",
                    "Prijs per meter": " "
                    "Totaalprijs": " "
                "Spoelbak": 
                    "Prijs": " ",
                    "Type": " ",
                "Totaalprijs": " "
            Waar je alle informatie en prijzen correct invult en aanpast indien nodig.
            ` },
            { "role": "user", "content": openaiAnswer }
        ];

        const completion = await this.client.chat.create({
            model: this.jsonModel,
            responseFormat: { "type": "json_object" },
            messages: conversionInstructions
        });

        const jsonConversion = completion.data.choices[0].message.content;
        return jsonConversion;
    }

    async startupSequence() {
        this.dbInfo = (//await fetch("http://localhost:5018/Options")).json();
        {
            "Materiaalsoort": "Noble Desiree Grey Matt",
            "Spatrand": "0-150mm",
            "Vensterbank": "150 mm+",
            "Boorgaten per stuk": "mogelijk",
            "WCD (Wandcontactdoos)": "mogelijk",
            "Randafwerking": "niet mogelijk",
            "Prijs per m2": "€ 247.52",
            "Randafwerking p/m": "€ 87.00",
            "Spatrand p/m": "€ 35.00",
            "Vensterbank p/m": "€ 309.40",
            "Uitsparing onderbouw": "€ 151.50",
            "Uitsparing inleg": "€ 97.50",
            "Uitsparing ruw": "€ 70.00",
            "Kraangat": "€ 10.70",
            "Zeepdispenser": "€ 10.70",
            "Boorgaten per stuk": "€ 5.00",
            "WCD": "€ 13.50",
            "Achterwand p/m": "€ 309.40",
            "Randafwerking p/m": "€ 28.00"
        });
    
        const FIRST_SYSTEM_MESSAGE = { "role": "system", "content": `
        [1] Je bent een bot gemaakt voor het beantwoorden van vragen over de producten die wij verkopen.
        [2] Wij als bedrijv verkopen keukebladen.
        [3] Als iemand een vraag heeft over een onderdeel probeer je zo veel mogenlijk te helpen.
        [4] Alle koste zijn gefixeerd en kunnen niet veranderd worden.
        [5] Nooit kortingen geven.
        [6] Als iemand iets vraagt wat niet in onze catalogus staat, 
            meld dat het niet in onze catalogus staat en geef een alternatief.
        [7] Als iemand een vraag stelt die niet over een product gaat, 
            meld dat het niet over een product gaat en geef een alternatief.
        [8] Indien er informatie mist zoals de maten vraag voor de maten.
        [9] Als iemand een materiaalsoort geeft wat dicht in de buurt zit, 
            vraag of het dichtbijzijnde materiaalsoort bedoelt wordt. 
            Voorbeeld zou zijn Noble Desiree Grey wordt Noble Desiree Grey Matt.
        [10] Je geeft geen onnodige informatie terug.
        [11] Je helpt alleen met een offerte maken, 
            kleine beetjes praat is niet relevant tenzij informatie mist of er een voorstel gemaakt wordt.
        [12] Je vraagt naar alle informatie die nodig is om een offerte te maken. 
        Dat is: 
            [1] Materiaalsoort (Verplicht veld),
            [2] m2 (verplicht veld),
            [3] Randafwerking: (Verplicht veld; geen randafwerking mag ook),
            [4] Spatrand (indien van toepassing; heeft m2 en hoogte in mm nodig),
            [5] Vensterbank (indien van toepassing ook hoogte in mm invullen),
            [6] Uitsparing spoelbak (onderbouw, inleg of ruw),
            [7] Kraangat (Optioneel; vaste diameters (niet op te geven)),
            [8] Zeepdispenser (Optioneel; vaste diameters (niet op te geven)),
            [9] Boorgaten per stuk: (Optioneel, diameter in mm op te geven),
            [10] Wandcontactdoos (Optioneel indien mogelijk; diameter in mm in te vullen),
            [11] Achterwand m2 (Optioneel),
            [12] Randafwerking achterwand (Optioneel)
        [13] Ga stap voor stap deze lijst af om een totaal offerte te maken.
        [14] Geef stap voor stap de opties op. Zoals welke materiaal soorten we verkopen. 
            Wat de afmeting per m(2) kost. Als het verplicht is of iemand het wilt of niet. ect.
        [15] Vraag niet alles in een keer. Vraag per onderdeel. De berichten blijven heen en weer gaan. 
            Nooit in een keer alles vragen.
        [16] Als alle info is beantword vraag of de offerte bevestigd moet worden 
            en geef een korte samenvatting van de offerte en zeg je precies en geen variaties van: 'Wilt u de offerte bevestigen?'
        [17] Als het bevestigd wordt zeg je: 'Bedankt voor het bevestigen van de offerte.'
        ` };
        this.chatHistory.push(FIRST_SYSTEM_MESSAGE);
    
        for (const item in this.dbInfo) {
            this.chatHistory.push({ "role": "user", "content": `Dit is onderdeel wat we verkopen met alle informatie als gegeven: ${item}` });
        }
    }
}

module.exports = { OpenAiManager };