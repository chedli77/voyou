"use strict";
(() => {
  // extension/manifest.json
  var manifest_default = {
    manifest_version: 3,
    name: "Voyou",
    version: "0.3.0",
    description: "__MSG_extDescription__",
    default_locale: "fr",
    minimum_chrome_version: "110",
    permissions: ["storage"],
    action: {
      default_popup: "popup/popup.html",
      default_title: "Voyou",
      default_icon: {
        "16": "icons/icon16.png",
        "32": "icons/icon32.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      }
    },
    icons: {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    content_scripts: [
      {
        matches: ["https://x.com/*", "https://twitter.com/*"],
        js: ["content/content.bundle.js"],
        css: ["content/content.css"],
        run_at: "document_start",
        all_frames: false
      }
    ]
  };

  // extension/detection/lists/ar.json
  var ar_default = {
    terms: [
      {
        id: "bl-ar-arabizi-racism",
        category: "racism",
        weight: 0.85,
        terms: ["kahlouch", "ka7louch", "kahlouche", "zenji", "zinji"],
        note: "Insultes racistes visant les Noirs, écrites en lettres latines."
      },
      {
        id: "bl-ar-arabizi-lgbt",
        category: "hate",
        weight: 0.85,
        terms: ["khawal", "5awal", "zamel", "zemel", "zaml"],
        note: "Insultes homophobes, écrites en lettres latines."
      },
      {
        id: "bl-ar-arabizi-insults",
        category: "insult",
        weight: 0.8,
        terms: [
          "sharmouta",
          "charmouta",
          "sharmota",
          "9a7ba",
          "qahba",
          "kahba",
          "kosomak",
          "kos omak",
          "kos ommak",
          "ibn el kalb",
          "ya kalb",
          "ya 7mar",
          "ya hmar"
        ],
        note: "Insultes, écrites en lettres latines."
      },
      {
        id: "bl-ar-arabizi-profanity",
        category: "profanity",
        weight: 0.5,
        terms: ["zebi", "zabi", "tfou"],
        note: "Jurons en lettres latines, masqués seulement si le filtre vulgarité est activé."
      }
    ],
    patterns: [
      {
        id: "pat-ar-racism",
        category: "racism",
        weight: 0.85,
        pattern: "(?<![\\p{L}])(?:[وفب]?)(?:زنجي|زنوج|زنجية|كحلوش|كحلوشة)(?![\\p{L}])",
        flags: "iu",
        note: "Insultes racistes visant les Noirs."
      },
      {
        id: "pat-ar-abd",
        category: "racism",
        weight: 0.8,
        pattern: "(?<![\\p{L}])يا\\s+(?:عبد|عبيد)(?!\\s*(?:ال|الله|الرحمن|العزيز|الكريم|[\\u0600-\\u06FF]))",
        flags: "iu",
        note: "« ya abd » (esclave) adressé à quelqu'un. Les prénoms comme Abdallah passent."
      },
      {
        id: "pat-ar-monkey",
        category: "racism",
        weight: 0.75,
        pattern: "(?<![\\p{L}])(?:يا\\s+قرد|يا\\s+قردة|انت\\s+قرد|ارجع\\s+(?:ل|الى\\s+|إلى\\s+)?(?:افريقيا|أفريقيا|الغابة))(?![\\p{L}])",
        flags: "iu",
        note: "Comparaison au singe, renvoi vers l'Afrique."
      },
      {
        id: "pat-ar-go-home",
        category: "racism",
        weight: 0.75,
        pattern: "(?<![\\p{L}])(?:ارجع|ارجعوا|روح|روحوا)\\s+(?:ل|الى\\s+|إلى\\s+)?(?:بلدك|بلادك|بلدكم|بلادكم)(?![\\p{L}])",
        flags: "iu",
        note: "« ارجع لبلدك » (retourne dans ton pays)."
      },
      {
        id: "pat-ar-sectarian",
        category: "hate",
        weight: 0.85,
        pattern: "(?<![\\p{L}])(?:[وفب]?)(?:رافضي|رافضة|روافض|نصيري|نصيرية|نواصب|ناصبي)(?![\\p{L}])",
        flags: "iu",
        note: "Insultes confessionnelles."
      },
      {
        id: "pat-ar-antisemitism",
        category: "hate",
        weight: 0.9,
        pattern: "(?:احفاد|أحفاد)\\s+القردة\\s+والخنازير|(?<![\\p{L}])يا\\s+يهودي(?![\\p{L}])",
        flags: "iu",
        note: "Cliché antisémite, « يهودي » employé comme insulte. Le mot seul passe."
      },
      {
        id: "pat-ar-lgbt",
        category: "hate",
        weight: 0.85,
        pattern: "(?<![\\p{L}])(?:[وفب]?)(?:خول|لوطي|لوطية|زامل)(?![\\p{L}])",
        flags: "iu",
        note: "Insultes homophobes."
      },
      {
        id: "pat-ar-sexism",
        category: "hate",
        weight: 0.6,
        pattern: "(?<![\\p{L}])(?:مكانك|مكانكم|مكانها)\\s+(?:في\\s+)?(?:ال)?مطبخ(?![\\p{L}])",
        flags: "iu",
        note: "Sexisme (« ta place est à la cuisine »)."
      },
      {
        id: "pat-ar-insults",
        category: "insult",
        weight: 0.8,
        pattern: "(?<![\\p{L}])(?:[وفب]?)(?:شرموطة|شرموط|قحبة|كسمك|كس\\s+امك|كس\\s+أمك)(?![\\p{L}])|(?<![\\p{L}])(?:ابن|يا\\s+ابن)\\s+(?:الكلب|الشرموطة|القحبة|الحرام)(?![\\p{L}])|(?<![\\p{L}])يا\\s+(?:كلب|حمار|خنزير|حيوان)(?![\\p{L}])",
        flags: "iu",
        note: "Insultes."
      },
      {
        id: "pat-ar-threat",
        category: "threat",
        weight: 0.85,
        pattern: "(?<![\\p{L}])(?:سأقتلك|سوف\\s+اقتلك|راح\\s+اقتلك|رح\\s+اقتلك|بقتلك|حقتلك|نقتلك|الله\\s+ياخذك|ان\\s+شاء\\s+الله\\s+تموت|إن\\s+شاء\\s+الله\\s+تموت|يجب\\s+قتلهم|لازم\\s+يموتوا)(?![\\p{L}])|\\b(?:n9atlek|n9telk|nqatlek|bnqtlk)\\b",
        flags: "iu",
        note: "Menaces."
      },
      {
        id: "pat-ar-profanity",
        category: "profanity",
        weight: 0.5,
        pattern: "(?<![\\p{L}])(?:[وفب]?)(?:زبي|زب|تفو)(?![\\p{L}])",
        flags: "iu",
        note: "Jurons, masqués seulement si le filtre vulgarité est activé."
      }
    ]
  };

  // extension/detection/lists/de.json
  var de_default = {
    terms: [
      {
        id: "bl-de-racism",
        category: "racism",
        weight: 0.9,
        terms: ["schlitzauge", "schlitzaugen", "ölauge", "ölaugen", "kameltreiber"],
        note: "Insultes racistes."
      },
      {
        id: "bl-de-lgbt",
        category: "hate",
        weight: 0.8,
        terms: ["tunte", "tunten", "kampflesbe", "kampflesben"],
        note: "Insultes anti-LGBT."
      },
      {
        id: "bl-de-ableist",
        category: "hate",
        weight: 0.6,
        terms: ["spast", "spasti", "spastis", "missgeburt"],
        note: "Handicap utilisé comme insulte."
      },
      {
        id: "bl-de-insults",
        category: "insult",
        weight: 0.7,
        terms: ["arschloch", "arschlöcher", "hurensohn", "hurensöhne", "wichser", "vollidiot", "drecksau"],
        note: "Insultes."
      },
      {
        id: "bl-de-profanity",
        category: "profanity",
        weight: 0.5,
        terms: ["scheiße", "scheisse", "scheiß", "verfickt", "kacke"],
        note: "Jurons, masqués seulement si le filtre vulgarité est activé."
      }
    ],
    patterns: [
      {
        id: "pat-de-racism",
        category: "racism",
        weight: 0.8,
        pattern: "(?<![\\p{L}\\p{N}_])(?:kanaken?|neger|zigeunerpack|negerpack)(?![\\p{L}\\p{N}_])",
        flags: "iu",
        note: "Insultes racistes."
      },
      {
        id: "pat-de-insult",
        category: "insult",
        weight: 0.6,
        pattern: "(?<![\\p{L}\\p{N}_])(?:abschaum|ungeziefer|gesindel)(?![\\p{L}\\p{N}_])",
        flags: "iu",
        note: "Déshumanisation."
      },
      {
        id: "pat-de-threat",
        category: "threat",
        weight: 0.8,
        pattern: "(?<![\\p{L}\\p{N}_])(?:schie(?:ß|ss)befehl)(?![\\p{L}\\p{N}_])|geh(?:ö|oe)ren\\s+(?:abgeschafft|vergast|erschossen|ausgerottet|aufgeh(?:ä|ae)ngt)|\\bich\\s+(?:bring(?:e)?\\s+dich\\s+um|töte\\s+dich|finde\\s+dich|weiß\\s+wo\\s+du\\s+wohnst)\\b|\\bhoffentlich\\s+(?:stirbst|verreckst)\\s+du\\b|\\bbring\\s+dich\\s+(?:doch\\s+)?um\\b",
        flags: "iu",
        note: "Menaces et appels à tuer."
      },
      {
        id: "pat-de-go-home",
        category: "racism",
        weight: 0.8,
        pattern: "\\bgeh(?:t)?\\s+(?:zurück|heim)\\s+(?:in|nach)\\s+(?:dein|euer|ihr)e?s?\\s+(?:land|heimatland)\\b|\\bausländer\\s+raus\\b|\\bab\\s+(?:nach|in\\s+die)\\s+(?:afrika|heimat)\\b|\\bdeutschland\\s+den\\s+deutschen\\b",
        flags: "iu",
        note: "Renvois. « ab nach Hause » passe."
      },
      {
        id: "pat-de-dirty",
        category: "racism",
        weight: 0.85,
        pattern: "(?<![\\p{L}\\p{N}_])(?:dreckige?[rns]?\\s+(?:kanaken?|ausländer|türken?|araber|neger|zigeuner|afrikaner))(?![\\p{L}\\p{N}_])",
        flags: "iu",
        note: "« dreckig » + origine."
      },
      {
        id: "pat-de-religion",
        category: "hate",
        weight: 0.85,
        pattern: "(?<![\\p{L}\\p{N}_])(?:dreckige?[rns]?\\s+(?:juden?|muslime?|moslems?))(?![\\p{L}\\p{N}_])|(?<![\\p{L}\\p{N}_])(?:(?:juden|muslime|moslems)\\s+(?:raus|vergasen))(?![\\p{L}\\p{N}_])|(?<![\\p{L}\\p{N}_])(?:judenpack|judensau)(?![\\p{L}\\p{N}_])",
        flags: "iu",
        note: "Haine religieuse."
      },
      {
        id: "pat-de-jungle",
        category: "racism",
        weight: 0.75,
        pattern: "\\bzurück\\s+(?:in\\s+den\\s+dschungel|auf\\s+(?:den|die)\\s+bäume?)\\b",
        flags: "iu",
        note: "Renvoi « dans la jungle »."
      },
      {
        id: "pat-de-affe",
        category: "insult",
        weight: 0.6,
        pattern: "\\bdu\\s+(?:dummer\\s+|blöder\\s+)?(?:affe|äffin)\\b",
        flags: "iu",
        note: "« du Affe » : insulte courante, pas forcément raciste."
      },
      {
        id: "pat-de-sexism",
        category: "hate",
        weight: 0.65,
        pattern: "\\b(?:zurück|ab)\\s+(?:in\\s+die\\s+küche|an\\s+den\\s+herd)\\b|\\b(?:dumme|blöde|dreckige)\\s+(?:hure|schlampe|fotze)\\b",
        flags: "iu",
        note: "Sexisme."
      },
      {
        id: "pat-de-ableist",
        category: "hate",
        weight: 0.6,
        pattern: "\\bdu\\s+(?:bist\\s+)?(?:doch\\s+)?(?:behindert|mongo)\\b",
        flags: "iu",
        note: "Handicap utilisé comme insulte. « behindert » seul est un mot neutre."
      },
      {
        id: "pat-de-directed-insult",
        category: "insult",
        weight: 0.6,
        pattern: "\\bdu\\s+(?:bist\\s+(?:ein|eine)\\s+)?(?:idiot|vollidiot|depp|trottel|vollpfosten|lappen)\\b",
        flags: "iu",
        note: "Insulte adressée."
      }
    ]
  };

  // extension/detection/lists/en.json
  var en_default = {
    terms: [
      {
        id: "bl-en-nword",
        category: "racism",
        weight: 0.95,
        terms: ["nigger", "niggers", "nigga", "niggas"],
        note: "Mot en n anglais et ses variantes."
      },
      {
        id: "bl-en-coon",
        category: "racism",
        weight: 0.85,
        terms: ["coon", "coons"],
        note: "Insulte raciste anglaise. Le sens animal est rare sur X."
      },
      {
        id: "bl-en-spic",
        category: "racism",
        weight: 0.85,
        terms: ["spic", "spics"],
        note: "Insulte visant les Latinos."
      },
      {
        id: "bl-en-kike",
        category: "hate",
        weight: 0.9,
        terms: ["kike", "kikes", "kyke", "kykes"],
        note: "Insulte antisémite."
      },
      {
        id: "bl-en-paki",
        category: "racism",
        weight: 0.85,
        terms: ["paki", "pakis"],
        note: "Insulte visant les Pakistanais et Sud-Asiatiques."
      },
      {
        id: "bl-en-wetback",
        category: "racism",
        weight: 0.85,
        terms: ["wetback", "wetbacks"],
        note: "Insulte visant les Mexicains et immigrés."
      },
      {
        id: "bl-en-raghead",
        category: "hate",
        weight: 0.85,
        terms: ["raghead", "ragheads", "towelhead", "towelheads"],
        note: "Insulte islamophobe ou anti-arabe."
      },
      {
        id: "bl-en-dirty-arab",
        category: "racism",
        weight: 0.8,
        terms: ["dirty arab", "dirty arabs", "you arab scum"],
        note: "Insulte ethnique en plusieurs mots."
      },
      {
        id: "bl-en-black-ape",
        category: "racism",
        weight: 0.8,
        terms: ["black ape", "black apes", "you ape"],
        note: "Comparaison au singe visant les Noirs. Poids 0.8 voulu, « you ape » compris."
      },
      {
        id: "bl-en-scum-attack",
        category: "insult",
        weight: 0.75,
        terms: ["you scum", "piece of scum", "human scum", "worthless scum"],
        note: "Insulte anglaise en plusieurs mots, pour éviter les titres de presse."
      },
      {
        id: "bl-en-beaner",
        category: "racism",
        weight: 0.85,
        terms: ["beaner", "beaners"],
        note: "Insulte visant les Latinos."
      },
      {
        id: "bl-en-gook",
        category: "racism",
        weight: 0.85,
        terms: ["gook", "gooks"],
        note: "Insulte visant les Asiatiques."
      },
      {
        id: "bl-en-jungle-bunny",
        category: "racism",
        weight: 0.9,
        terms: ["jungle bunny", "jungle bunnies", "porch monkey", "porch monkeys"],
        note: "Insultes racistes visant les Noirs."
      },
      {
        id: "bl-en-lgbt",
        category: "hate",
        weight: 0.8,
        terms: ["dyke", "dykes", "tranny", "trannies", "shemale", "shemales"],
        note: "Insultes anti-LGBT."
      },
      {
        id: "bl-en-ableist",
        category: "hate",
        weight: 0.6,
        terms: ["retard", "retards", "retarded"],
        note: "Insulte validiste."
      },
      {
        id: "bl-en-christ-killer",
        category: "hate",
        weight: 0.8,
        terms: ["christ killer", "christ killers"],
        note: "Cliché antisémite."
      },
      {
        id: "bl-en-insults",
        category: "insult",
        weight: 0.65,
        terms: [
          "motherfucker",
          "motherfuckers",
          "piece of shit",
          "dumbass",
          "dipshit",
          "asshole",
          "assholes",
          "jackass",
          "cunt",
          "cunts"
        ],
        note: "Insultes fortes."
      },
      {
        id: "bl-en-profanity",
        category: "profanity",
        weight: 0.5,
        terms: ["fuck", "fucking", "fucked", "fucks", "shit", "shitty", "bullshit", "wtf", "bitch"],
        note: "Jurons, masqués seulement si le filtre vulgarité est activé."
      }
    ],
    patterns: [
      {
        id: "pat-en-go-back",
        category: "racism",
        weight: 0.75,
        pattern: "go\\s+back(\\s+to)?\\s+(africa|your\\s+country|where\\s+you\\s+came\\s+from|mexico|the\\s+jungle)",
        flags: "i",
        note: "Renvoi « go back to… »."
      },
      {
        id: "pat-en-deport-all",
        category: "racism",
        weight: 0.7,
        pattern: "(deport|send\\s+back)\\s+(all\\s+)?(the\\s+)?(muslims|arabs|immigrants|illegals|blacks)",
        flags: "i",
        note: "Appel à expulser un groupe entier."
      },
      {
        id: "pat-en-monkey-people",
        category: "racism",
        weight: 0.7,
        pattern: "\\b(these|those|you)\\s+(people\\s+are\\s+)?(monkeys|apes|gorillas)\\b",
        flags: "i",
        note: "Singe visant des personnes, pas les animaux."
      },
      {
        id: "pat-en-banana-racial",
        category: "racism",
        weight: 0.55,
        pattern: "\\b(banana\\s+for\\s+brains|throw\\s+(him|her|them)\\s+a\\s+banana)\\b",
        flags: "i",
        note: "Moquerie raciste avec la banane."
      },
      {
        id: "pat-en-muslims-terrorists",
        category: "hate",
        weight: 0.7,
        pattern: "\\b(all|every)\\s+muslims?\\s+(are|is)\\s+terrorists?\\b",
        flags: "i",
        note: "Amalgame musulmans et terroristes."
      },
      {
        id: "pat-en-dirty-ethnicity",
        category: "racism",
        weight: 0.75,
        pattern: "\\b(dirty|filthy)\\s+(arab|arabs|muslim|muslims|jew|jews|black|blacks)\\b",
        flags: "i",
        note: "« dirty » + origine."
      },
      {
        id: "pat-en-white-power",
        category: "racism",
        weight: 0.8,
        pattern: "\\b(white\\s+power|wpww|1488)\\b",
        flags: "i",
        note: "Slogans et codes suprémacistes."
      },
      {
        id: "pat-en-directed-insult",
        category: "insult",
        weight: 0.6,
        pattern: "\\b(you('re|\\s+are|\\s+must\\s+be)?\\s+(such\\s+a\\s+)?(idiot|moron|dumbass|asshole)|what\\s+an\\s+(idiot|moron)|you\\s+idiot)\\b",
        flags: "i",
        note: "Insulte directe en anglais."
      },
      {
        id: "pat-en-dehumanize",
        category: "insult",
        weight: 0.6,
        pattern: "\\b(?:these|those|you|filthy|dirty)\\s+(?:\\w+\\s+)?(?:scum|vermin|rats|cockroaches|savages|subhumans?|pos|pieces?\\s+of\\s+shit|parasites)\\b|\\b(?:you|filthy|dirty)\\s+animals\\b|\\bscum\\s+like\\s+(?:that|them|you|this)\\b",
        flags: "i",
        note: "Déshumanisation (scum, vermin, rats…). « the animals » seul passe."
      },
      {
        id: "pat-en-violence",
        category: "threat",
        weight: 0.6,
        pattern: "\\b(?:shoot(?:ing)?|kill(?:ing)?|hang(?:ing)?|gas(?:sing)?|exterminat(?:e|ing))\\s+(?:them|em|'em|these|those|all\\s+of\\s+them)(?:\\s+all)?\\b|\\bkick\\s+(?:em|'em|them)\\s+again\\b|\\bkicking\\s+the\\s+shit\\s+out\\s+of\\b|\\bbeat\\s+(?:\\w+\\s+){0,2}into\\s+submission\\b|\\bpig\\s+fat\\b",
        flags: "i",
        note: "Appels à la violence en anglais."
      },
      {
        id: "pat-en-chink",
        category: "racism",
        weight: 0.85,
        pattern: "(?<![\\p{L}\\p{N}])(?:chinks?)(?![\\p{L}\\p{N}])(?!\\s+in\\s+(?:the|his|her|their|its|my|your|our)\\s+armou?r)",
        flags: "iu",
        note: "Insulte visant les Asiatiques. « chink in the armor » passe."
      },
      {
        id: "pat-en-send-back",
        category: "racism",
        weight: 0.75,
        pattern: "\\b(?:send|ship|kick)\\s+(?:them|these\\s+people|those\\s+people|all\\s+of\\s+them)\\s+back\\s+to\\s+(?:africa|mexico|the\\s+jungle|their\\s+(?:country|countries|shithole))\\b",
        flags: "iu",
        note: "« send them back to Africa »."
      },
      {
        id: "pat-en-groups-animals",
        category: "racism",
        weight: 0.75,
        pattern: "\\b(?:these|those|all|the)\\s+(?:immigrants|migrants|muslims|blacks|mexicans|arabs|africans)\\s+are\\s+(?:animals|savages|rats|vermin|cockroaches|parasites|subhuman)\\b",
        flags: "iu",
        note: "Groupe comparé à des animaux."
      },
      {
        id: "pat-en-threat",
        category: "threat",
        weight: 0.8,
        pattern: "\\b(?:kill\\s+yourself|kys|i(?:'ll|\\s+will|\\s+am\\s+going\\s+to|'m\\s+gonna|\\s+wanna)\\s+(?:kill|find|hurt|shoot|stab|end)\\s+you|(?:i\\s+)?hope\\s+you\\s+(?:die|get\\s+(?:shot|raped|killed|cancer))|you\\s+(?:should|deserve\\s+to)\\s+(?:die|be\\s+(?:shot|hanged|hung|killed|raped))|i\\s+know\\s+where\\s+you\\s+live)\\b",
        flags: "iu",
        note: "Menaces adressées."
      },
      {
        id: "pat-en-sexism",
        category: "hate",
        weight: 0.6,
        pattern: "\\b(?:go\\s+back\\s+to\\s+the\\s+kitchen|get\\s+back\\s+in(?:to)?\\s+the\\s+kitchen|make\\s+me\\s+a\\s+sandwich|women\\s+(?:belong|should\\s+stay)\\s+in\\s+the\\s+kitchen|(?:you|dumb|stupid|fat|ugly)\\s+(?:whore|slut|skank)s?)\\b",
        flags: "iu",
        note: "Sexisme."
      },
      {
        id: "pat-en-religion-threat",
        category: "hate",
        weight: 0.8,
        pattern: "\\b(?:all|these|those|the)\\s+(?:muslims|jews|christians)\\s+(?:should|must|need\\s+to)\\s+(?:die|be\\s+(?:killed|gassed|deported|exterminated))\\b",
        flags: "iu",
        note: "Appel contre un groupe religieux."
      }
    ]
  };

  // extension/detection/lists/es.json
  var es_default = {
    terms: [
      {
        id: "bl-es-racism",
        category: "racism",
        weight: 0.9,
        terms: [
          "sudaca",
          "sudacas",
          "negrata",
          "negratas",
          "panchito",
          "panchitos",
          "machupichu",
          "machupichus",
          "moraco",
          "moracos"
        ],
        note: "Insultes racistes."
      },
      {
        id: "bl-es-lgbt",
        category: "hate",
        weight: 0.8,
        terms: ["maricón", "maricon", "maricones", "bujarra", "bujarras", "tortillera", "tortilleras", "joto", "jotos"],
        note: "Insultes anti-LGBT. « marica » est exclu : en Colombie il veut souvent dire « mec »."
      },
      {
        id: "bl-es-ableist",
        category: "hate",
        weight: 0.6,
        terms: ["subnormal", "subnormales", "mongólico", "mongolico", "mongólicos", "mongolicos"],
        note: "Insultes validistes."
      },
      {
        id: "bl-es-insults",
        category: "insult",
        weight: 0.7,
        terms: [
          "gilipollas",
          "hijo de puta",
          "hija de puta",
          "hijos de puta",
          "hijoputa",
          "hdp",
          "malparido",
          "malparida",
          "pendejo",
          "pendeja",
          "pendejos",
          "cabrón",
          "cabrona",
          "cabrones",
          "imbécil",
          "imbéciles",
          "capullo",
          "mamón",
          "escoria"
        ],
        note: "Insultes."
      },
      {
        id: "bl-es-profanity",
        category: "profanity",
        weight: 0.5,
        terms: [
          "joder",
          "mierda",
          "coño",
          "hostia",
          "hostias",
          "carajo",
          "cojones",
          "chingada",
          "chingar",
          "verga",
          "puta"
        ],
        note: "Jurons, masqués seulement si le filtre vulgarité est activé."
      }
    ],
    patterns: [
      {
        id: "pat-es-de-mierda",
        category: "racism",
        weight: 0.9,
        pattern: "(?<![\\p{L}\\p{N}])(?:(?:negr[oa]s?|mor[oa]s?|chin[oa]s?|gitan[oa]s?|sudacas?|indi[oa]s?|panchit[oa]s?|inmigrantes?|extranjer[oa]s?)\\s+de\\s+mierda)(?![\\p{L}\\p{N}])",
        flags: "iu",
        note: "Origine + « de mierda »."
      },
      {
        id: "pat-es-go-home",
        category: "racism",
        weight: 0.75,
        pattern: "\\b(?:vete|vuelve|volved|vuelvan|regresa|regresen|l[aá]rgate|largaos)\\s+(?:a|para)\\s+(?:tu|vuestro|su)\\s+(?:pa[ií]s|tierra|pueblo)\\b|\\b(?:vete|vuelve|volved|vuelvan|regresa)\\s+a\\s+(?:[aá]frica|marruecos|la\\s+selva|la\\s+jungla|tu\\s+chabola)\\b",
        flags: "iu",
        note: "« vuelve a tu país »."
      },
      {
        id: "pat-es-fuera",
        category: "racism",
        weight: 0.75,
        pattern: "\\bfuera\\s+(?:los\\s+|las\\s+)?(?:inmigrantes|moros|negros|sudacas|extranjeros|ilegales|panchitos|musulmanes)\\b",
        flags: "iu",
        note: "« fuera los inmigrantes »."
      },
      {
        id: "pat-es-monkey",
        category: "racism",
        weight: 0.7,
        pattern: "\\b(?:eres|pareces)\\s+(?:un|una)\\s+(?:mono|mona|simio|gorila|macaco)\\b",
        flags: "iu",
        note: "Personne comparée à un singe. « qué mono », « son monos » (mignons) passent."
      },
      {
        id: "pat-es-animals",
        category: "racism",
        weight: 0.75,
        pattern: "\\b(?:esos|estos|los|esas|estas)\\s+(?:inmigrantes|moros|negros|sudacas|gitanos|musulmanes)\\s+(?:son\\s+)?(?:animales|ratas|cucarachas|par[aá]sitos|basura|escoria|salvajes)\\b",
        flags: "iu",
        note: "Groupe comparé à des animaux."
      },
      {
        id: "pat-es-religion",
        category: "hate",
        weight: 0.8,
        pattern: "(?<![\\p{L}\\p{N}])(?:(?:jud[ií][oa]s?|musulman(?:es|a|as)?|cristian[oa]s?)\\s+de\\s+mierda)(?![\\p{L}\\p{N}])|\\brata\\s+jud[ií]a\\b",
        flags: "iu",
        note: "Haine religieuse."
      },
      {
        id: "pat-es-sexism",
        category: "hate",
        weight: 0.6,
        pattern: "\\b(?:vuelve|vete|a)\\s+(?:a\\s+)?la\\s+cocina\\b|\\b(?:zorra|perra|puta)\\s+de\\s+mierda\\b|\\bpinche\\s+(?:vieja|puta|perra)\\b",
        flags: "iu",
        note: "Sexisme."
      },
      {
        id: "pat-es-ableist",
        category: "hate",
        weight: 0.6,
        pattern: "\\b(?:eres|pareces)\\s+(?:un|una)?\\s*(?:retrasad[oa]|mongol[oa]|subnormal|autista)\\b",
        flags: "iu",
        note: "Handicap utilisé comme insulte. « el tren está retrasado » passe."
      },
      {
        id: "pat-es-threat",
        category: "threat",
        weight: 0.8,
        pattern: "\\b(?:te\\s+voy\\s+a\\s+(?:matar|reventar|partir\\s+la\\s+cara|buscar|encontrar)|ojal[aá]\\s+(?:te\\s+mueras|te\\s+maten|os\\s+maten|les\\s+maten)|mu[eé]rete(?!\\s+de)|m[aá]tate|hay\\s+que\\s+(?:matarlos|fusilarlos|exterminarlos|colgarlos)(?!\\s+de)|merecen\\s+(?:morir|la\\s+muerte))\\b",
        flags: "iu",
        note: "Menaces. « muérete de risa » passe."
      },
      {
        id: "pat-es-directed-insult",
        category: "insult",
        weight: 0.6,
        pattern: "\\b(?:eres|sois)\\s+(?:un|una|unos|unas)?\\s*(?:idiota|est[uú]pid[oa]|imb[eé]cil|in[uú]til|payas[oa]|tont[oa]|basura|pedazo\\s+de\\s+mierda)s?\\b",
        flags: "iu",
        note: "Insulte adressée."
      }
    ]
  };

  // extension/detection/lists/fr.json
  var fr_default = {
    terms: [
      {
        id: "bl-fr-negre",
        category: "racism",
        weight: 0.95,
        terms: ["nègre", "nègres", "negre", "negres"],
        requireAttackCompanion: true,
        note: "Ne compte qu'avec un autre signal d'attaque : l'usage littéraire ou historique seul doit passer."
      },
      {
        id: "bl-fr-bamboula",
        category: "racism",
        weight: 0.9,
        terms: ["bamboula", "bamboulas"],
        note: "Insulte raciste."
      },
      {
        id: "bl-fr-bougnoule",
        category: "racism",
        weight: 0.95,
        terms: ["bougnoule", "bougnoules", "bougnoul"],
        note: "Insulte raciste visant les Arabes et Maghrébins."
      },
      {
        id: "bl-fr-sale-arabe",
        category: "racism",
        weight: 0.85,
        terms: ["sale arabe", "sales arabes", "sale maghrébin", "sale maghrebin"],
        note: "Construction « sale » + origine."
      },
      {
        id: "bl-fr-sale-noir",
        category: "racism",
        weight: 0.85,
        terms: ["sale noir", "sales noirs", "sale noire", "sales noires"],
        note: "Construction « sale » + couleur de peau."
      },
      {
        id: "bl-fr-youpin",
        category: "hate",
        weight: 0.9,
        terms: ["youpin", "youpins", "youpine"],
        note: "Insulte antisémite."
      },
      {
        id: "bl-fr-crouille",
        category: "racism",
        weight: 0.85,
        terms: ["crouille", "crouilles", "crouillat"],
        note: "Insulte visant les Maghrébins."
      },
      {
        id: "bl-fr-raton",
        category: "racism",
        weight: 0.55,
        terms: ["raton", "ratons"],
        requireAttackCompanion: true,
        note: "Ne compte qu'avec un autre signal d'attaque : « raton laveur » doit passer."
      },
      {
        id: "bl-fr-bicot",
        category: "racism",
        weight: 0.9,
        terms: ["bicot", "bicots"],
        note: "Insulte visant les Arabes."
      },
      {
        id: "bl-fr-negro",
        category: "racism",
        weight: 0.8,
        terms: ["négro", "négros"],
        note: "Usage haineux en français. Sans accent, « negro » est la couleur noire en espagnol et en portugais."
      },
      {
        id: "bl-fr-gnoule",
        category: "racism",
        weight: 0.9,
        terms: ["gnoule", "gnoules"],
        note: "Forme tronquée de bougnoule, vue dans le corpus."
      },
      {
        id: "bl-fr-mongole",
        category: "hate",
        weight: 0.7,
        terms: ["mongole", "mongoles"],
        note: "Insulte validiste. Les formes « mongole(s) » seulement, pas le peuple « Mongols »."
      },
      {
        id: "bl-fr-racaille",
        category: "insult",
        weight: 0.7,
        terms: ["racaille", "racailles"],
        note: "Insulte déshumanisante."
      },
      {
        id: "bl-fr-sale-racaille",
        category: "insult",
        weight: 0.85,
        terms: [
          "sale racaille",
          "sales racailles",
          "immonde racaille",
          "petite racaille",
          "p'tite racaille",
          "ptite racaille"
        ],
        note: "Formes renforcées de racaille."
      },
      {
        id: "bl-fr-sous-merde",
        category: "insult",
        weight: 0.8,
        terms: ["sous-merde", "sous merde", "sous merdes", "sous-merdes"],
        note: "Insulte déshumanisante."
      },
      {
        id: "bl-fr-sous-homme",
        category: "insult",
        weight: 0.85,
        terms: ["sous-homme", "sous homme", "sous-hommes", "sous hommes"],
        note: "Insulte déshumanisante."
      },
      {
        id: "bl-fr-connard",
        category: "insult",
        weight: 0.7,
        terms: ["connard", "connards", "connasse", "connasses"],
        note: "Presque toujours une insulte directe. « con » seul passe par les motifs."
      },
      {
        id: "bl-fr-abruti",
        category: "insult",
        weight: 0.65,
        terms: ["abruti", "abrutis", "abrutie", "abruties"],
        note: "Insulte directe."
      },
      {
        id: "bl-fr-tocard",
        category: "insult",
        weight: 0.75,
        terms: ["tocard", "tocards"],
        note: "Insulte."
      },
      {
        id: "bl-fr-encule",
        category: "insult",
        weight: 0.85,
        terms: ["enculé", "enculés", "encule", "encules"],
        note: "Insulte forte."
      },
      {
        id: "bl-fr-enfoire",
        category: "insult",
        weight: 0.8,
        terms: ["enfoiré", "enfoirés", "enfoire", "enfoires"],
        note: "Insulte."
      },
      {
        id: "bl-fr-salaud",
        category: "insult",
        weight: 0.8,
        terms: ["salaud", "salauds", "salope", "salopes"],
        note: "Insulte."
      },
      {
        id: "bl-fr-cretin",
        category: "insult",
        weight: 0.7,
        terms: ["crétin", "crétins", "cretin", "cretins"],
        note: "Insulte."
      },
      {
        id: "bl-fr-naze",
        category: "insult",
        weight: 0.65,
        terms: ["naze", "nazes"],
        note: "Insulte."
      },
      {
        id: "bl-fr-boloss",
        category: "insult",
        weight: 0.7,
        terms: ["boloss", "bolosses"],
        note: "Insulte."
      },
      {
        id: "bl-fr-branleur",
        category: "insult",
        weight: 0.8,
        terms: ["branleur", "branleurs", "branleuse", "branleuses"],
        note: "Insulte."
      },
      {
        id: "bl-fr-ordure-person",
        category: "insult",
        weight: 0.7,
        terms: ["ordure", "ordures"],
        note: "Poids moyen : le sens littéral (déchets) existe."
      },
      {
        id: "bl-fr-pourri",
        category: "insult",
        weight: 0.65,
        terms: ["pourri", "pourris", "pourrie", "pourries"],
        note: "Poids moyen : « système pourri » peut déclencher, le bouton Afficher reste la sortie."
      },
      {
        id: "bl-fr-debile",
        category: "insult",
        weight: 0.65,
        terms: ["débile", "débiles", "debile", "debiles"],
        note: "Insulte, souvent dans une phrase adressée."
      },
      {
        id: "bl-fr-cassos",
        category: "insult",
        weight: 0.7,
        terms: ["cassos", "cassoss"],
        note: "Argot (cas social)."
      },
      {
        id: "bl-fr-lgbt",
        category: "hate",
        weight: 0.8,
        terms: ["gouine", "gouines", "travelo", "travelos"],
        note: "Insultes anti-LGBT."
      },
      {
        id: "bl-fr-profanity",
        category: "profanity",
        weight: 0.5,
        terms: [
          "putain",
          "merde",
          "bordel",
          "chier",
          "foutre",
          "nique",
          "niquer",
          "ta gueule",
          "fais chier",
          "fait chier"
        ],
        note: "Jurons, masqués seulement si le filtre vulgarité est activé."
      },
      {
        id: "bl-fr-gauchiasse",
        category: "insult",
        weight: 0.55,
        terms: ["gauchiasse", "gauchiasses", "droitardé", "droitardés"],
        note: "Termes injurieux pour un camp politique."
      }
    ],
    patterns: [
      {
        id: "pat-fr-rentrez",
        category: "racism",
        weight: 0.7,
        pattern: "\\b(rentrez|retourne[rz]?|retournez|rentre)\\s+(chez\\s+vous|dans\\s+ton\\s+pays|dans\\s+votre\\s+pays)\\b",
        flags: "i",
        note: "« Rentrez chez vous » et variantes."
      },
      {
        id: "pat-fr-dehors-etrangers",
        category: "racism",
        weight: 0.7,
        pattern: "\\b(dehors|dehors\\s+les)\\s+(étrangers|etrangers|immigrés|immigres|arabes|noirs)\\b",
        flags: "i",
        note: "Slogans d'expulsion."
      },
      {
        id: "pat-fr-sale-racial",
        category: "racism",
        weight: 0.8,
        pattern: "\\bsales?\\s+(arabe|arabes|noir|noirs|noire|noires|n[eè]gre|n[eè]gres|bougnoule|bamboula)\\b",
        flags: "i",
        note: "« sale » + origine. Recoupe la blocklist."
      },
      {
        id: "pat-fr-singe-people",
        category: "racism",
        weight: 0.7,
        pattern: "\\b(?:ces|vous\\s+[eê]tes\\s+des?|sales?|bande\\s+de|esp[eè]ces?\\s+de)\\s+(?:singes?|gorilles?)\\b|\\bles\\s+(?:singes|gorilles)\\s+(?:dehors|rentrez|retournez|en\\s+afrique|dans\\s+(?:la|leur)\\s+jungle)\\b",
        flags: "iu",
        note: "Singe visant des personnes. « les singes du parc » passe."
      },
      {
        id: "pat-fr-banane-racial",
        category: "racism",
        weight: 0.55,
        pattern: "\\b(lance[rz]?\\s+(lui|leur)\\s+une\\s+banane|mange(r)?\\s+ta\\s+banane)\\b",
        flags: "i",
        note: "Moquerie raciste avec la banane."
      },
      {
        id: "pat-fr-tous-racailles-immigres",
        category: "racism",
        weight: 0.55,
        pattern: "\\b(immigr[eé]s?|étrangers|etrangers)\\s+(c['']?est\\s+)?tous\\s+(des\\s+)?racailles\\b",
        flags: "i",
        note: "Amalgame immigrés et racailles."
      },
      {
        id: "pat-fr-retourne-afrique",
        category: "racism",
        weight: 0.7,
        pattern: "\\b(retourne[rz]?|rentre[rz]?|rentrez|vas?)\\s+(en\\s+afrique|au\\s+maghreb|au\\s+bled|dans\\s+(ton|votre)\\s+pays|chez\\s+(toi|vous))\\b",
        flags: "i",
        note: "Renvoi vers l'Afrique, le Maghreb ou le bled. Tolère l'orthographe « vas » du corpus."
      },
      {
        id: "pat-fr-bled-merde",
        category: "racism",
        weight: 0.55,
        pattern: "\\b(bleds?|trous?)\\s+(de\\s+|à\\s+)?merde\\b",
        flags: "i",
        note: "Insulte sur le pays d'origine, souvent avec un renvoi."
      },
      {
        id: "pat-fr-babouin-people",
        category: "racism",
        weight: 0.55,
        pattern: "\\b(comme\\s+des?\\s+)?babouins?\\b",
        flags: "i",
        note: "Babouin visant des personnes."
      },
      {
        id: "pat-fr-simiesque-racial",
        category: "racism",
        weight: 0.8,
        pattern: "\\b(g[eé]n[eé]tique\\s+)?simiesques?\\b.*\\b(n[eè]gre|bougnoule|noir|arabe)|\\b(n[eè]gre|bougnoule|noir|arabe).{0,40}simiesques?\\b",
        flags: "i",
        note: "Pseudo-science raciale sur les singes."
      },
      {
        id: "pat-fr-qi-racial",
        category: "racism",
        weight: 0.7,
        pattern: "\\b(qi|quotient\\s+intellectuel)\\s*(faible|bas|d[eé]ficient).{0,40}(musulman|maghr[eé]bin|africain|arabe|noir)|(musulman|maghr[eé]bin|africain|arabe|noir).{0,40}(qi|quotient\\s+intellectuel)\\s*(faible|bas|d[eé]ficient)",
        flags: "i",
        note: "QI associé à un groupe. « QI » seul doit passer."
      },
      {
        id: "pat-fr-coton-expulsion",
        category: "racism",
        weight: 0.6,
        pattern: "\\b(retourne|rentre|rentrez|vas?).{0,120}champs?\\s+de\\s+coton\\b|champs?\\s+de\\s+coton.{0,120}(retourne|rentre|parasite)",
        flags: "i",
        note: "Cliché colonial du coton avec renvoi ou parasite. « coton » seul passe."
      },
      {
        id: "pat-fr-non-blancs-partent",
        category: "racism",
        weight: 0.75,
        pattern: "\\b(les\\s+)?non[-\\s]?blancs?\\s+(partent|partez|dehors|d[eé]gagent|d[eé]gagez|rentrent|rentrez)\\b|\\b(que\\s+les\\s+)?non[-\\s]?blancs?\\s+partent\\b|\\bdehors\\s+(les\\s+)?non[-\\s]?blancs?\\b",
        flags: "i",
        note: "« Que les non-blancs partent »."
      },
      {
        id: "pat-fr-group-dehors-partent",
        category: "racism",
        weight: 0.7,
        pattern: "\\b(les\\s+)?(arabes?|noirs?|musulmans?|immigr[eé]s?|maghr[eé]bins?)\\s+(dehors|partent|partez|d[eé]gage[ntz]*|rentrent)\\b|\\bdehors\\s+(les\\s+)?(arabes?|noirs?|musulmans?|immigr[eé]s?)\\b",
        flags: "i",
        note: "Arabes, Noirs ou musulmans « dehors » ou « qu'ils partent »."
      },
      {
        id: "pat-fr-death-celebration",
        category: "threat",
        weight: 0.8,
        pattern: "\\b(est\\s+)?mort[es]?\\b[\\s\\S]{0,120}\\b(heureux|heureuse|heureuses|plaisir|ftg|jouissance|jouis)\\b|\\b(heureux|heureuse|plaisir|ftg|putain\\s+de\\s+plaisir)\\b[\\s\\S]{0,120}\\b(est\\s+)?mort[es]?\\b",
        flags: "i",
        note: "Mort + joie (heureux, plaisir). Les avis de décès sans joie passent."
      },
      {
        id: "pat-fr-non-blancs-expulsion",
        category: "racism",
        weight: 0.7,
        pattern: "\\b(que\\s+)?(les\\s+)?non[- ]?blancs?\\s+(partent|d[eé]gagent|se\\s+cassent|foutent\\s+le\\s+camp|d[eé]guerpissent|disparaissent)\\b|\\b(partent|d[eé]gagent|dehors)\\b.{0,40}\\bnon[- ]?blancs?\\b",
        flags: "i",
        note: "Expulsion visant les non-blancs."
      },
      {
        id: "pat-fr-voyou-attack",
        category: "insult",
        weight: 0.55,
        pattern: "\\b((c['']?est|c['']?[eé]tait|est|[eé]tait)\\s+(un\\s+|une\\s+)?|(un|une|ce|cette)\\s+|((petit[es]?|p['’]?tites?|p['’]?tit|gros+e?|grand[es]?|vrai[es]?)\\s+))voyous?\\b|\\bvoyous?\\s+(tout\\s+court|litt[eé]ralement|[eé]videmment)\\b|\\b(comportement|fin)\\s+de\\s+voyou\\b",
        flags: "i",
        note: "« voyou » seulement en attaque (c'est un voyou, petit voyou). Poids faible."
      },
      {
        id: "pat-fr-meme-communaute-dogwhistle",
        category: "racism",
        weight: 0.8,
        pattern: "m[eê]me\\s+communaut[eé][\\s\\S]{0,200}(viol\\w*|kalash\\w*|kalachnikov\\w*|terroris\\w*|attentat\\w*)|(viol\\w*|kalash\\w*|terroris\\w*|attentat\\w*)[\\s\\S]{0,200}m[eê]me\\s+communaut[eé]",
        flags: "iu",
        note: "Sous-entendu « même communauté » + viol, kalash ou terrorisme."
      },
      {
        id: "pat-fr-vermine-person",
        category: "insult",
        weight: 0.7,
        pattern: "\\b(sale\\s+)?vermine\\b|\\b(cette|ce|une?)\\s+vermine\\b|\\bvermine\\s+de\\b",
        flags: "i",
        note: "Personne traitée de vermine."
      },
      {
        id: "pat-fr-dechet-person",
        category: "insult",
        weight: 0.7,
        pattern: "\\b(un\\s+)?d[eé]chet\\s+en\\s+moins\\b|\\b(ce|cette|un|une)\\s+d[eé]chet\\b|\\b(sale\\s+)?d[eé]chet\\b",
        flags: "i",
        note: "Personne traitée de déchet."
      },
      {
        id: "pat-fr-racaille-framed",
        category: "insult",
        weight: 0.55,
        pattern: "(?:c['']?(?:est|[ée]tait)\\s+(?:une?\\s+)?|une?\\s+|sale\\s+|des?\\s+)racailles?\\b",
        flags: "i",
        note: "Racaille dans une phrase d'attaque."
      },
      {
        id: "pat-fr-execution-threat",
        category: "threat",
        weight: 0.85,
        pattern: "(doivent\\s+[eê]tre\\s+ex[eé]cut[eé]s?|doit\\s+[eê]tre\\s+ex[eé]cut[eé]|[aà]\\s+ex[eé]cuter|il\\s+faut\\s+(les\\s+|l['']\\s*)?ex[eé]cuter|ex[eé]cutez[-\\s]?les|qu['']ils?\\s+(soient|soit)\\s+ex[eé]cut[eé]s?)",
        flags: "iu",
        note: "Menace d'exécution avec un verbe d'obligation. « ont été exécutés » dans la presse passe."
      },
      {
        id: "pat-fr-dessouder-justifie",
        category: "threat",
        weight: 0.8,
        pattern: "dessoud[eé]r?[\\s\\S]{0,80}justifi[eé]e?s?|justifi[eé]e?s?[\\s\\S]{0,80}dessoud[eé]r?",
        flags: "iu",
        note: "Meurtre (dessouder) présenté comme justifié."
      },
      {
        id: "pat-fr-doivent-etre-executes",
        category: "threat",
        weight: 0.9,
        pattern: "\\b(doivent|doit|devrait|devraient|il\\s+faut)\\s+(être|etre)\\s+ex[ée]cut[ée]s?\\b|\\bex[ée]cut(er|és?|ées?)\\s+(ces|les|des)\\s+\\w+\\b|\\b(pendaison|fusill(?:er|és?)|extermin(?:er|és?))\\b.{0,40}\\b(tous|tous\\s+ces|ces\\s+gens)\\b",
        flags: "i",
        note: "« doivent être exécutés »."
      },
      {
        id: "pat-fr-directed-con",
        category: "insult",
        weight: 0.6,
        pattern: "(t['']?es|tu\\s+es|t['']?as\\s+l['']air|tu\\s+dois\\s+[eê]tre|[eê]tre|es)\\s+(con|connard|connasse|abruti|abrutie|imb[eé]cile|idiot|idiote|d[eé]bile)(\\s+toi)?\\b|esp[eè]ce\\s+de\\s+(con|connard|connasse|abruti|abrutie|imb[eé]cile|idiot|idiote|d[eé]bile)\\b|comment\\s+tu\\s+dois\\s+[eê]tre\\s+(con|connard|connasse|abruti|abrutie|imb[eé]cile|idiot|idiote|d[eé]bile)(\\s+toi)?|(quel|quelle)\\s+(con|connard|connasse|abruti|abrutie|imb[eé]cile|idiot|idiote|d[eé]bile)\\b(?!\\s+je\\s+(?:suis|fais))|pauvre\\s+(con|connard|connasse|abruti|abrutie|imb[eé]cile|idiot|idiote|d[eé]bile)\\b|sale\\s+(con|connard|connasse|abruti|abrutie|imb[eé]cile|idiot|idiote|d[eé]bile)\\b|toi\\s+(le|la)\\s+(con|connard|connasse|abruti|abrutie|imb[eé]cile|idiot|idiote|d[eé]bile)\\b",
        flags: "iu",
        note: "« t'es con », « tu dois être con ». « con » seul et « à contresens » passent. « Quel imbécile je suis » passe."
      },
      {
        id: "pat-fr-petit-con",
        category: "insult",
        weight: 0.7,
        pattern: "\\b(un|une|ce|cette|le|la)\\s+(p['’]?tites?|petites?|p['’]?tit|gros+e?|sales?|pauvres?|vrais?\\s+)?cons?\\b|\\b(p['’]?tit|petits?|p['’]?tites?|petites?|gros+e?|sales?|pauvres?|vrais?)\\s+cons?\\b",
        flags: "iu",
        note: "« un petit con », « p'tit con ». Jamais « con » seul."
      },
      {
        id: "pat-fr-ducon",
        category: "insult",
        weight: 0.7,
        pattern: "\\bducons?\\b",
        flags: "iu",
        note: "« ducon » comme mot entier."
      },
      {
        id: "pat-fr-putain-de-insult",
        category: "insult",
        weight: 0.75,
        pattern: "\\bputain\\s+de\\s+(tocard|encul[eé]s?|enfoir[eé]s?|salauds?|salopes?|connards?|connasses?|abrutis?|abruties?|cr[eé]tins?|d[eé]biles?|nazes?|boloss(?:es)?|branleurs?|branleuses?|ordures?|pourris?|pourries?|cassos|merdes?|cons?)\\b",
        flags: "iu",
        note: "« putain de » + insulte. « putain » seul passe."
      },
      {
        id: "pat-fr-tes-un-insult",
        category: "insult",
        weight: 0.75,
        pattern: "\\b(t['’]?es|tu\\s+es|t['’]?as\\s+l['’]?air)\\s+(vraiment\\s+)?(un|une)\\s+(putain\\s+de\\s+)?(tocard|encul[eé]s?|enfoir[eé]s?|salauds?|salopes?|connards?|connasses?|abrutis?|abruties?|cr[eé]tins?|d[eé]biles?|nazes?|boloss(?:es)?|branleurs?|branleuses?|ordures?|pourris?|pourries?|cassos|merdes?|cons?)\\b",
        flags: "iu",
        note: "« t'es un » + insulte."
      },
      {
        id: "pat-fr-espece-sale-insult",
        category: "insult",
        weight: 0.7,
        pattern: "\\b(esp[eè]ce\\s+d['’]?|sale\\s+|pauvre\\s+|gros+e?\\s+|vrai\\s+)(tocard|encul[eé]s?|enfoir[eé]s?|salauds?|salopes?|connards?|connasses?|abrutis?|abruties?|cr[eé]tins?|d[eé]biles?|nazes?|boloss(?:es)?|branleurs?|branleuses?|ordures?|pourris?|pourries?|cassos|merdes?|cons?)\\b",
        flags: "iu",
        note: "« espèce de », « sale » ou « pauvre » + insulte."
      },
      {
        id: "pat-fr-tes-insult-adj",
        category: "insult",
        weight: 0.65,
        pattern: "\\b(t['’]?es|tu\\s+es)\\s+(vraiment\\s+)?(tocard|encul[eé]s?|enfoir[eé]s?|salauds?|salopes?|connards?|connasses?|abrutis?|abruties?|cr[eé]tins?|d[eé]biles?|nazes?|boloss(?:es)?|branleurs?|branleuses?|ordures?|pourris?|pourries?|cassos|merdes?|cons?|lamentables?|path[ée]tiques?|minables?|pitoyables?|ridicules?|immondes?|ignobles?)\\b",
        flags: "iu",
        note: "« t'es pourri », « t'es lamentable », « t'es pathétique » sans « un »."
      },
      {
        id: "pat-fr-en-moins-celebration",
        category: "threat",
        weight: 0.85,
        pattern: "(?:d[eé]linquant\\w*|d[eé]chet|racaille|voyou|vermine|ordure|merde|mort\\w*|assassin\\w*|criminel\\w*).{0,80}(?:un|une)\\s+en\\s+moins|(?:un|une)\\s+en\\s+moins.{0,80}(?:dommage|bien\\s+fait|encore|enfin|bravo|tant\\s+mieux|parfait)|\\b(?:un|une)\\s+(?:d[eé]chet|d[eé]linquant\\w*|racaille|voyou|vermine|ordure)\\s+en\\s+moins\\b",
        flags: "iu",
        note: "« un en moins » pour se réjouir d'une mort."
      },
      {
        id: "pat-fr-possessive-de-merde",
        category: "insult",
        weight: 0.75,
        pattern: "\\b(ton|ta|son|sa|tes|ses|mon|ma)\\s+[\\w'-]{2,40}\\s+de\\s+merde\\b",
        flags: "iu",
        note: "« ton X de merde ». « ce film de merde » passe."
      },
      {
        id: "pat-fr-est-un-delinquant",
        category: "insult",
        weight: 0.6,
        pattern: "\\b(est|c['’]?est|[eé]tait)\\s+(bien\\s+)?(un|une)\\s+d[eé]linquant\\w*\\b",
        flags: "iu",
        note: "« c'est un délinquant » en attaque. Les titres de presse passent."
      },
      {
        id: "pat-fr-merde-de-person",
        category: "insult",
        weight: 0.75,
        pattern: "\\b(?:cette|une?|la)\\s+merde\\s+de\\s+[\\w'-]{2,40}\\b",
        flags: "iu",
        note: "« cette merde de X »."
      },
      {
        id: "pat-fr-parle-dune-merde",
        category: "insult",
        weight: 0.55,
        pattern: "\\b(?:on\\s+parle\\s+d['’]?|c['’]?est\\s+|quelle?\\s+)\\s*(?:une?\\s+)?merde\\b|\\bd['’]une\\s+merde\\b",
        flags: "iu",
        note: "Personne traitée de merde. « merde » seul passe."
      },
      {
        id: "pat-fr-retourne-ton-pays",
        category: "racism",
        weight: 0.6,
        pattern: "(?:rest(?:er|e|ez)|retourn(?:er|e|es|ez)|rentr(?:er|e|es|ez)|repart(?:ir|ez|s))\\s+(?:pas\\s+)?(?:dans|chez|au|en)\\s+(?:ton|ta|votre|vos|leur|leurs|son)\\s+(?:pays|bled|afrique|maghreb|alg[ée]rie|maroc|tunisie)",
        flags: "iu",
        note: "« retourne dans ton pays », « fallait rester dans ton pays »."
      },
      {
        id: "pat-fr-essentialism",
        category: "racism",
        weight: 0.65,
        pattern: "(?:sauvagerie|barbarie|violence|b[êe]tise|d[ée]linquance)\\s+(?:propre|typique|inh[ée]rente?|naturelle)s?\\s+(?:aux|des|à\\s+la\\s+race)\\s*(?:arabes|africains|noirs|musulmans|maghr[ée]bins|immigr[ée]s|n[èe]gres)?",
        flags: "iu",
        note: "Sauvagerie attribuée à une origine."
      },
      {
        id: "pat-fr-qi-faible",
        category: "racism",
        weight: 0.55,
        pattern: "(?:vos|leurs?|ton|votre)\\s+qis?\\s+(?:sont|est)\\s+[^.!?]{0,30}(?:faibles?|bas|catastrophiques?)",
        flags: "iu",
        note: "QI faible adressé à quelqu'un. « QI » seul passe."
      },
      {
        id: "pat-fr-insultes-fortes",
        category: "insult",
        weight: 0.5,
        pattern: "(?<![\\p{L}])(?:fdp|fils\\s+de\\s+(?:pute|chienne)|nique\\s+(?:ta|sa|vos|votre)\\s+m[èe]re|ntm|enfoir[ée]s?|encul[ée]s?|connard|connasse|salope|b[âa]tards?)(?![\\p{L}])",
        flags: "iu",
        note: "Insultes fortes (fdp, etc.)."
      },
      {
        id: "pat-fr-sale-x",
        category: "insult",
        weight: 0.55,
        pattern: "(?<![\\p{L}])sales?\\s+(?:gauchistes?|fachos?|merdes?|cons?|chiens?|rats?|tra[îi]tres?|b[âa]tards?|colons?|wokes?)(?![\\p{L}])",
        flags: "iu",
        note: "« sale » + étiquette (gauchiste, facho…)."
      },
      {
        id: "pat-fr-deshumanisation",
        category: "insult",
        weight: 0.65,
        pattern: "(?:vous\\s+[êe]tes|ce\\s+sont|c['’]est|t['’]es|tu\\s+es|ces|tous\\s+ces|esp[èe]ces?\\s+d['’e]|bande\\s+d['’e]|que\\s+des)\\s*(?:des\\s+|une?\\s+|de\\s+la\\s+|petites?\\s+)?(?:vermines?|cafards?|parasites?|rats|sous[- ]hommes?|sous[- ]race|ordures|d[ée]chets|merdes(?:\\s+pleureuses)?|animaux|singes|sauvages|chiens|porcs|crapules|raclures?)(?![\\p{L}])",
        flags: "iu",
        note: "« vous êtes des » + vermine, merdes, animaux…"
      },
      {
        id: "pat-fr-petite-merde",
        category: "insult",
        weight: 0.5,
        pattern: "(?<![\\p{L}])petites?\\s+(?:merdes?|crapules?|raclures?|baltringues?)(?![\\p{L}])",
        flags: "iu",
        note: "« petite merde »."
      },
      {
        id: "pat-fr-faut-les-tuer",
        category: "threat",
        weight: 0.8,
        pattern: "(?:faut|faudrait|il\\s+faut|on\\s+devrait|qu['’]on)\\s+(?:les|tous\\s+les|le|la)\\s+(?:tuer|buter|abattre|fusiller|cramer|br[ûu]ler|gazer|exterminer|pendre|noyer|d[ée]foncer|tabasser)",
        flags: "iu",
        note: "Appel au meurtre."
      },
      {
        id: "pat-fr-sale-origine",
        category: "racism",
        weight: 0.8,
        pattern: "(?<![\\p{L}])sales?\\s+(?:bicots?|ritals?|ritales?|nègres?|negres?|blacks?|renois|rebeus?|beurs?|immigr[ée]s?|migrants?|chinois|chinetoques?|noich|roms?|gitans?)(?![\\p{L}])",
        flags: "iu",
        note: "« sale » + origine."
      },
      {
        id: "pat-fr-sale-religion",
        category: "hate",
        weight: 0.8,
        pattern: "(?<![\\p{L}])sales?\\s+(?:juifs?|juives?|feujs?|musulman(?:e|s|es)?|islamo\\p{L}*|cathos?|chr[ée]tiens?)(?![\\p{L}])",
        flags: "iu",
        note: "« sale » + religion."
      },
      {
        id: "pat-fr-threat",
        category: "threat",
        weight: 0.8,
        pattern: "\\b(?:je\\s+vais\\s+te\\s+(?:tuer|buter|crever|retrouver|d[ée]foncer|planter|[ée]gorger)|on\\s+va\\s+te\\s+(?:tuer|buter|retrouver|crever)|va\\s+te\\s+(?:pendre|faire\\s+tuer)|j['’]esp[eè]re\\s+que\\s+tu\\s+(?:vas\\s+)?(?:cr[eè]ver|cr[eè]ves|mourir|meures|mourras)|tu\\s+m[ée]rites\\s+de\\s+(?:mourir|cr[eè]ver)|suicide[\\s-]toi|tue[\\s-]toi)\\b|(?:^|[.!?,;:]\\s*)va\\s+(?:crever|mourir)\\b",
        flags: "iu",
        note: "Menaces adressées. « il va mourir » (presse) passe."
      },
      {
        id: "pat-fr-sexism",
        category: "hate",
        weight: 0.65,
        pattern: "\\b(?:retourne\\s+(?:[àa]|dans)\\s+(?:la|ta)\\s+cuisine|ta\\s+place\\s+est\\s+(?:[àa]|dans)\\s+la\\s+cuisine)\\b|(?<![\\p{L}])(?:sales?|grosses?|esp[eè]ces?\\s+de)\\s+(?:putes?|chiennes?|salopes?)(?![\\p{L}])",
        flags: "iu",
        note: "Sexisme. « va dans la cuisine chercher le sel » passe."
      },
      {
        id: "pat-fr-ableist",
        category: "hate",
        weight: 0.6,
        pattern: "\\b(?:t['’]?es|tu\\s+es|esp[eè]ce\\s+d['’]?|sale)\\s*(?:un\\s+|une\\s+)?(?:attard[ée]e?|trisomiques?|autistes?|mongols?|handicap[ée]e?)\\b",
        flags: "iu",
        note: "Handicap utilisé comme insulte. Le mot seul (« autiste ») passe."
      },
      {
        id: "pat-fr-etiquette-de-merde",
        category: "insult",
        weight: 0.65,
        pattern: "(?<![\\p{L}])(?:gauchiasses?|gauchistes?|gauchos?|fachos?|fascistes?|droitards?|islamo-?gauchistes?|wokistes?|wokes?|bobos?|macronistes?|zemmouriens?|lepénistes?|insoumis|f[ée]ministes?|racistes?|bouffons?|clowns?|guignols?)\\s+de\\s+merde(?![\\p{L}])",
        flags: "iu",
        note: "Étiquette politique ou personnelle + « de merde » (« gauchiste de merde »). « ce film de merde » passe."
      }
    ]
  };

  // extension/detection/lists/it.json
  var it_default = {
    terms: [
      {
        id: "bl-it-racism",
        category: "racism",
        weight: 0.9,
        terms: ["negraccio", "negracci", "bingo bongo", "vu cumprà", "vucumprà"],
        note: "Insultes racistes."
      },
      {
        id: "bl-it-terrone",
        category: "racism",
        weight: 0.7,
        terms: ["terrone", "terroni", "terrona"],
        note: "Insulte visant les gens du sud de l'Italie."
      },
      {
        id: "bl-it-lgbt",
        category: "hate",
        weight: 0.8,
        terms: ["frocio", "froci", "ricchione", "ricchioni", "culattone", "culattoni"],
        note: "Insultes homophobes. « finocchio » est exclu : c'est aussi le fenouil."
      },
      {
        id: "bl-it-insults",
        category: "insult",
        weight: 0.7,
        terms: [
          "stronzo",
          "stronza",
          "stronzi",
          "coglione",
          "coglioni",
          "testa di cazzo",
          "pezzo di merda",
          "figlio di puttana",
          "imbecille",
          "imbecilli",
          "vaffanculo"
        ],
        note: "Insultes."
      },
      {
        id: "bl-it-profanity",
        category: "profanity",
        weight: 0.5,
        terms: ["cazzo", "cazzi", "minchia", "porca puttana", "porco dio", "porca madonna", "porca miseria"],
        note: "Jurons, masqués seulement si le filtre vulgarité est activé."
      }
    ],
    patterns: [
      {
        id: "pat-it-go-home",
        category: "racism",
        weight: 0.75,
        pattern: "\\b(?:torna(?:te)?(?:tene|vene)?|vattene|andatevene)\\s+(?:al|nel|a|in)\\s+(?:tuo|vostro|loro)\\s+paese\\b|\\b(?:tornatene|tornate(?:vene)?|torna)\\s+in\\s+africa\\b|\\brimandateli\\s+(?:a\\s+casa|in\\s+africa)\\b",
        flags: "iu",
        note: "« tornatene al tuo paese »."
      },
      {
        id: "pat-it-di-merda",
        category: "racism",
        weight: 0.9,
        pattern: "(?<![\\p{L}\\p{N}_])(?:(?:negr[oaie]|marocchin[oaie]|zingar[oaie]|albanes[ei]|rumen[oaie]|cines[ei]|extracomunitari[oa]?|immigrat[oaie])\\s+di\\s+merda)(?![\\p{L}\\p{N}_])",
        flags: "iu",
        note: "Origine + « di merda »."
      },
      {
        id: "pat-it-sporco",
        category: "racism",
        weight: 0.85,
        pattern: "(?<![\\p{L}\\p{N}_])(?:sporc[oaih]+e?\\s+(?:negr[oaie]|zingar[oaie]|marocchin[oaie]|terron[ei]))(?![\\p{L}\\p{N}_])",
        flags: "iu",
        note: "« sporco » + origine."
      },
      {
        id: "pat-it-monkey",
        category: "racism",
        weight: 0.75,
        pattern: "\\bsei\\s+(?:una\\s+|uno\\s+|proprio\\s+una\\s+)?scimmia\\b|\\bscimmie\\s+(?:africane|nere)\\b|\\btorna(?:te)?\\s+sugli\\s+alberi\\b",
        flags: "iu",
        note: "Comparaison au singe. Le singe du zoo passe."
      },
      {
        id: "pat-it-religion",
        category: "hate",
        weight: 0.8,
        pattern: "(?<![\\p{L}\\p{N}_])(?:(?:ebre[oi]|musulman[oi]|islamic[oi])\\s+di\\s+merda|sporc[oh]i?\\s+ebre[oi])(?![\\p{L}\\p{N}_])",
        flags: "iu",
        note: "Haine religieuse."
      },
      {
        id: "pat-it-sexism",
        category: "hate",
        weight: 0.6,
        pattern: "\\btorna(?:re)?\\s+in\\s+cucina\\b|\\b(?:brutta|sporca|lurida)\\s+(?:troia|puttana|zoccola)\\b",
        flags: "iu",
        note: "Sexisme."
      },
      {
        id: "pat-it-ableist",
        category: "hate",
        weight: 0.6,
        pattern: "\\bsei\\s+(?:un\\s+|una\\s+)?(?:ritardat[oa]|mongoloide|handicappat[oa]|down)\\b",
        flags: "iu",
        note: "Handicap utilisé comme insulte. « il treno è in ritardo » passe."
      },
      {
        id: "pat-it-threat",
        category: "threat",
        weight: 0.8,
        pattern: "\\b(?:ti\\s+(?:ammazzo|uccido|vengo\\s+a\\s+prendere|spacco\\s+la\\s+faccia)|spero\\s+che\\s+(?:tu\\s+)?(?:muoia|crepi)|ammazzati|devono\\s+morire|vanno\\s+(?:ammazzati|bruciati|impiccati))\\b",
        flags: "iu",
        note: "Menaces."
      },
      {
        id: "pat-it-directed-insult",
        category: "insult",
        weight: 0.6,
        pattern: "\\bsei\\s+(?:un|una|proprio\\s+un|proprio\\s+una)\\s+(?:idiota|cretin[oa]|deficiente|fallit[oa]|pagliaccio|buffone)\\b",
        flags: "iu",
        note: "Insulte adressée."
      }
    ]
  };

  // extension/detection/lists/multi.json
  var multi_default = {
    terms: [
      {
        id: "bl-any-monkey-racial",
        category: "racism",
        weight: 0.55,
        terms: ["banania", "singe savant"],
        note: "Clichés coloniaux (banania, singe savant)."
      }
    ],
    patterns: [
      {
        id: "pat-any-hang-tree",
        category: "racism",
        weight: 0.85,
        pattern: "\\b(hang|lynch)\\s+(him|her|them|all)\\b.*\\b(tree|noose)\\b|\\b(arbre|potence)\\b.*\\b(pend(re|ez|ons)?)\\b",
        flags: "i",
        note: "Menace de lynchage."
      },
      {
        id: "pat-homophobe",
        category: "hate",
        weight: 0.6,
        pattern: "(?<![\\p{L}])(?:p[ée]d[ée]s?|tarlouzes?|tapettes?|fiottes?|faggots?|schwuchteln?|maricones?)(?![\\p{L}])|,\\s*homo\\s*[.!?]*\\s*$",
        flags: "iu",
        note: "Insultes homophobes courantes (FR, EN, DE, ES). « fag » est exclu : c'est aussi une cigarette au Royaume-Uni."
      },
      {
        id: "emo-ape-only",
        category: "racism",
        weight: 0.55,
        pattern: "^(?=[^]*(?:🐒|🦍|🐵|🦧))(?:@\\w+\\s*)*(?:[^\\p{L}\\p{N}]|(?<![\\p{L}])(?:mdr|ptdr|lol|lmao|xd|a?ha(?:ha)+h?|a?h(?:ah)+)(?![\\p{L}]))*$",
        flags: "iu",
        note: "Réponse faite seulement d'emojis singe (avec emojis, @mentions ou mdr). 🙈🙉🙊 ne comptent pas. Écrit en un seul passage pour rester rapide sur un texte long."
      },
      {
        id: "emo-ape-directed",
        category: "racism",
        weight: 0.55,
        pattern: "(?<![\\p{L}])(?:t['’]es|tu\\s+es|t['’]?[ée]tais|tu\\s+ressembles?|c['’]est\\s+toi|comme\\s+toi|toi\\s+le|esp[èe]ces?\\s+d['’e]|bande\\s+d['’e]|ta\\s+race|(?<!je\\s)(?<!on\\s)retourne\\s+(?:dans|en|chez|au)|rentre\\s+chez|d[ée]gage|you\\s+(?:are|r|look)|you['’]re|ur\\s+(?:mom|mum|mother|mama)|that['’]?s\\s+you|go\\s+back)(?![\\p{L}])[^\\n]{0,40}?(?:🐒|🦍|🐵|🦧)|(?:🐒|🦍|🐵|🦧)[^\\n]{0,30}?(?<![\\p{L}])(?:t['’]es|tu\\s+es|t['’]?[ée]tais|tu\\s+ressembles?|c['’]est\\s+toi|comme\\s+toi|toi\\s+le|esp[èe]ces?\\s+d['’e]|bande\\s+d['’e]|ta\\s+race|(?<!je\\s)(?<!on\\s)retourne\\s+(?:dans|en|chez|au)|rentre\\s+chez|d[ée]gage|you\\s+(?:are|r|look)|you['’]re|ur\\s+(?:mom|mum|mother|mama)|that['’]?s\\s+you|go\\s+back)(?![\\p{L}])|(?<![\\p{L}])sales?\\s*(?:🐒|🦍|🐵|🦧)",
        flags: "iu",
        note: "Emoji singe adressé à quelqu'un (t'es, c'est toi, sale, you are…). Le zoo sans adresse passe."
      },
      {
        id: "emo-ape-banana",
        category: "racism",
        weight: 0.3,
        pattern: "(?:🐒|🦍|🐵|🦧)[^\\n]{0,20}?🍌|🍌[^\\n]{0,20}?(?:🐒|🦍|🐵|🦧)",
        flags: "u",
        note: "Singe + banane : renfort seulement, ne floute jamais seul."
      }
    ]
  };

  // extension/detection/lists/pt.json
  var pt_default = {
    terms: [
      {
        id: "bl-pt-racism",
        category: "racism",
        weight: 0.85,
        terms: ["tição", "ticao", "tições"],
        note: "Insulte raciste visant les Noirs."
      },
      {
        id: "bl-pt-crioulo",
        category: "racism",
        weight: 0.8,
        terms: ["crioulo", "crioula", "crioulos", "crioulas"],
        requireAttackCompanion: true,
        note: "Ne compte qu'avec un autre signal : c'est aussi le nom d'une langue et d'un peuple."
      },
      {
        id: "bl-pt-lgbt",
        category: "hate",
        weight: 0.8,
        terms: [
          "viado",
          "viados",
          "sapatão",
          "sapatao",
          "sapatona",
          "traveco",
          "travecos",
          "boiola",
          "boiolas",
          "baitola",
          "baitolas"
        ],
        note: "Insultes anti-LGBT. « veado » (le cerf) et « bicha » sont exclus."
      },
      {
        id: "bl-pt-ableist",
        category: "hate",
        weight: 0.6,
        terms: ["retardado", "retardada", "retardados", "mongoloide", "mongoloides"],
        note: "Insultes validistes."
      },
      {
        id: "bl-pt-insults",
        category: "insult",
        weight: 0.7,
        terms: [
          "filho da puta",
          "filha da puta",
          "filhos da puta",
          "arrombado",
          "arrombada",
          "otário",
          "babaca",
          "babacas",
          "desgraçado",
          "desgraçada",
          "escroto",
          "cuzão",
          "cuzao",
          "pau no cu",
          "lixo humano",
          "imbecil",
          "imbecis"
        ],
        note: "Insultes."
      },
      {
        id: "bl-pt-profanity",
        category: "profanity",
        weight: 0.5,
        terms: ["porra", "caralho", "merda", "foda-se", "fodase", "puta que pariu", "pqp", "cacete", "buceta"],
        note: "Jurons, masqués seulement si le filtre vulgarité est activé."
      }
    ],
    patterns: [
      {
        id: "pat-pt-imundo",
        category: "racism",
        weight: 0.85,
        pattern: "(?<![\\p{L}\\p{N}])(?:(?:pret[oa]s?|negr[oa]s?|cigan[oa]s?|macac[oa]s?)\\s+(?:imund[oa]s?|fedid[oa]s?|nojent[oa]s?|safad[oa]s?|sujo|suja|ladr[aã]o|ladr[oõ]es|de\\s+merda))(?![\\p{L}\\p{N}])",
        flags: "iu",
        note: "Couleur ou origine + insulte (« preto imundo »)."
      },
      {
        id: "pat-pt-monkey",
        category: "racism",
        weight: 0.75,
        pattern: "\\b(?:seu|sua|seus|suas)\\s+(?:macac[oa]s?|gorilas?|primatas?)\\b|\\bvolta\\s+(?:pra|para)\\s+(?:a\\s+)?jaula\\b|\\bvai\\s+comer\\s+banana\\b",
        flags: "iu",
        note: "« seu macaco », « volta pra jaula ». Le singe du zoo passe."
      },
      {
        id: "pat-pt-go-home",
        category: "racism",
        weight: 0.75,
        pattern: "\\b(?:volta|volte|voltem|vai\\s+embora|vão\\s+embora)\\s+(?:pra|para|pro)\\s+(?:o\\s+|a\\s+)?(?:teu|seu|tua|sua)\\s+(?:pa[ií]s|terra)\\b|\\b(?:volta|vai|volte)\\s+(?:pra|para)\\s+(?:a\\s+)?(?:[aá]frica|senzala)\\b|\\blugar\\s+de\\s+pret[oa]\\s+[eé]\\s+na\\s+senzala\\b",
        flags: "iu",
        note: "« volta pro teu país », « volta pra senzala »."
      },
      {
        id: "pat-pt-animals",
        category: "racism",
        weight: 0.75,
        pattern: "\\b(?:esses|estes|os|essas|estas)\\s+(?:imigrantes|pretos|negros|ciganos|haitianos|venezuelanos|nordestinos|africanos)\\s+(?:s[aã]o\\s+)?(?:animais|ratos|baratas|parasitas|lixo|selvagens|macacos)\\b",
        flags: "iu",
        note: "Groupe comparé à des animaux."
      },
      {
        id: "pat-pt-religion",
        category: "hate",
        weight: 0.8,
        pattern: "(?<![\\p{L}\\p{N}])(?:(?:judeus?|judias?|mu[çc]ulman[oa]s?|crent(?:e|es))\\s+(?:imund[oa]s?|nojent[oa]s?|de\\s+merda))(?![\\p{L}\\p{N}])",
        flags: "iu",
        note: "Haine religieuse."
      },
      {
        id: "pat-pt-sexism",
        category: "hate",
        weight: 0.6,
        pattern: "\\bvolta\\s+(?:pra|para)\\s+(?:a\\s+)?cozinha\\b|\\blugar\\s+de\\s+mulher\\s+[eé]\\s+na\\s+cozinha\\b|\\b(?:vadia|piranha|vagabunda|puta)\\s+(?:de\\s+merda|imunda|nojenta)\\b",
        flags: "iu",
        note: "Sexisme."
      },
      {
        id: "pat-pt-ableist",
        category: "hate",
        weight: 0.6,
        pattern: "\\b(?:voc[eê]\\s+[eé]|seu|sua)\\s+(?:um\\s+|uma\\s+)?(?:retardad[oa]|mongoloide|autista|down)\\b",
        flags: "iu",
        note: "Handicap utilisé comme insulte."
      },
      {
        id: "pat-pt-threat",
        category: "threat",
        weight: 0.8,
        pattern: "\\b(?:vou\\s+te\\s+(?:matar|pegar|achar|furar|quebrar)|tomara\\s+que\\s+(?:voc[eê]\\s+|vc\\s+)?(?:morra|morram|seja\\s+morto)|vai\\s+se\\s+matar|se\\s+mata(?!\\s+de)|merece\\s+morrer|(?:voc[eê]|vc|tu|voc[eê]s|eles|essa\\s+gente)\\s+(?:tem|t[eê]m|tens)\\s+que\\s+(?:morrer|ser\\s+mort[oa]s?)|bandido\\s+bom\\s+[eé]\\s+bandido\\s+morto)\\b",
        flags: "iu",
        note: "Menaces. « se mata de trabalhar » et « todo mundo tem que morrer » passent."
      },
      {
        id: "pat-pt-directed-insult",
        category: "insult",
        weight: 0.6,
        pattern: "\\b(?:voc[eê]\\s+[eé]|seu|sua)\\s+(?:um\\s+|uma\\s+)?(?:idiota|burr[oa]|lixo|vagabund[oa]|corno|palha[çc]o|in[uú]til)\\b",
        flags: "iu",
        note: "Insulte adressée (« seu idiota »)."
      }
    ]
  };

  // extension/detection/categories.js
  var CATEGORIES = [
    { id: "racism", enabledByDefault: true },
    { id: "hate", enabledByDefault: true },
    { id: "threat", enabledByDefault: true },
    { id: "insult", enabledByDefault: true },
    { id: "profanity", enabledByDefault: false }
  ];
  var DEFAULT_CATEGORIES = CATEGORIES.filter((c) => c.enabledByDefault).map((c) => c.id);

  // extension/detection/normalize.js
  var ARABIC_MARKS = /[\u0640\u064B-\u065F\u0670]/g;
  var INVISIBLE = /[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u3164\uFE00-\uFE0F\uFEFF]/g;
  var HOMOGLYPHS = {
    а: "a",
    в: "b",
    е: "e",
    ё: "e",
    і: "i",
    ї: "i",
    ј: "j",
    к: "k",
    м: "m",
    н: "h",
    о: "o",
    р: "p",
    с: "c",
    т: "t",
    у: "y",
    х: "x",
    ѕ: "s",
    "ԁ": "d",
    "ԛ": "q",
    "ԝ": "w",
    ɡ: "g",
    А: "a",
    В: "b",
    Е: "e",
    К: "k",
    М: "m",
    Н: "h",
    О: "o",
    Р: "p",
    С: "c",
    Т: "t",
    Х: "x",
    І: "i",
    Ј: "j",
    Ѕ: "s",
    α: "a",
    ε: "e",
    ι: "i",
    κ: "k",
    ν: "v",
    ο: "o",
    ρ: "p",
    τ: "t",
    υ: "u",
    Α: "a",
    Β: "b",
    Ε: "e",
    Ζ: "z",
    Η: "h",
    Ι: "i",
    Κ: "k",
    Μ: "m",
    Ν: "n",
    Ο: "o",
    Ρ: "p",
    Τ: "t",
    Υ: "y",
    Χ: "x"
  };
  var HOMOGLYPH_RE = new RegExp(`[${Object.keys(HOMOGLYPHS).join("")}]`, "gu");
  var LATIN_RE = /[a-zA-Z\u00C0-\u024F]/;
  var LEET_DIGITS = { 0: "o", 3: "e", 4: "a", 5: "s", 7: "t", 9: "g" };
  var LEET_SYMBOLS = { "@": "a", $: "s", "€": "e", "!": "i", "|": "i" };
  var TOKEN_RE = /[\p{L}\p{M}\p{N}@$€!|'’]+/gu;
  var LETTER_RE = new RegExp("\\p{L}", "gu");
  var SPACED_RE = /(?<![\p{L}\p{N}])[\p{L}\p{N}]([ .\-_·•*+~/])[\p{L}\p{N}](?:\1[\p{L}\p{N}])+(?![\p{L}\p{N}])/gu;
  var STRETCHED_RE = new RegExp("(\\p{L})\\1{2,}", "gu");
  function mapHomoglyphs(text) {
    return text.replace(
      TOKEN_RE,
      (word) => LATIN_RE.test(word) ? word.replace(HOMOGLYPH_RE, (c) => HOMOGLYPHS[c]) : word
    );
  }
  function joinSpacedLetters(text) {
    return text.replace(SPACED_RE, (run, separator) => run.split(separator).join(""));
  }
  function mapLeet(text, one) {
    return text.replace(TOKEN_RE, (word) => {
      if ((word.match(LETTER_RE) ?? []).length < 2) return word;
      const chars = [...word];
      return chars.map((c, i) => {
        if (c === "1") return one;
        if (LEET_DIGITS[c]) return LEET_DIGITS[c];
        if (LEET_SYMBOLS[c] && i > 0 && i < chars.length - 1) return LEET_SYMBOLS[c];
        return c;
      }).join("");
    });
  }
  function textVariants(text) {
    const base = joinSpacedLetters(
      mapHomoglyphs(text.normalize("NFKC").replace(INVISIBLE, "").replace(ARABIC_MARKS, ""))
    );
    const withI = mapLeet(base, "i");
    const variants = /* @__PURE__ */ new Set([
      withI,
      // Lettres étirées réduites à une ("niiiigger") et à deux ("connnnard").
      // Les doubles ne sont jamais touchées : "Niger" ne devient pas une insulte.
      withI.replace(STRETCHED_RE, "$1"),
      withI.replace(STRETCHED_RE, "$1$1")
    ]);
    if (base.includes("1")) variants.add(mapLeet(base, "l"));
    variants.delete(text);
    return [...variants];
  }

  // extension/detection/score.js
  var VERSION = manifest_default.version;
  var THRESHOLDS = {
    low: { blur: 0.7, collapse: 0.9 },
    medium: { blur: 0.5, collapse: 0.75 },
    high: { blur: 0.35, collapse: 0.6 }
  };
  var MASKED_WEIGHT = 0.6;
  var BEFORE_WORD = "(?:^|[^\\p{L}\\p{N}_])";
  var AFTER_WORD = "(?:$|[^\\p{L}\\p{N}_])";
  var escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var wordsRegExp = (terms) => new RegExp(
    `${BEFORE_WORD}(${[...terms].sort((a, b) => b.length - a.length).map(escapeRegExp).join("|")})${AFTER_WORD}`,
    "iud"
  );
  function maskedEquals(token, term) {
    if (token.length !== term.length || token[0] !== term[0]) return false;
    let masks = 0;
    for (let i = 1; i < term.length; i++) {
      if (token[i] === "*" || token[i] === "#") masks++;
      else if (token[i] !== term[i]) return false;
    }
    return masks >= 1 && masks <= Math.floor(term.length / 3);
  }
  var maskedTokens = (text) => (text.toLowerCase().match(/[\p{L}\p{N}*#]+/gu) ?? []).filter((w) => /[*#]/.test(w)).map((w) => [...w]);
  var LISTS = (
    /** @type {any} */
    { fr: fr_default, en: en_default, es: es_default, pt: pt_default, it: it_default, de: de_default, ar: ar_default, multi: multi_default }
  );
  function compileTermRule(lang, entry) {
    const multiWord = entry.terms.filter((term) => /\s/.test(term));
    return {
      lang,
      entry,
      exact: wordsRegExp(entry.terms),
      // "salearabe" : terme en plusieurs mots écrit sans espaces, ou espacé lettre par lettre.
      glued: multiWord.length ? wordsRegExp(multiWord.map((term) => term.replace(/\s+/g, ""))) : null,
      masked: entry.terms.filter((term) => [...term].length >= 5 && !/[\s'’-]/.test(term)).map((term) => [...term.toLowerCase()])
    };
  }
  var TERM_RULES = Object.entries(LISTS).flatMap(
    ([lang, list]) => list.terms.map((entry) => compileTermRule(lang, entry))
  );
  var customCache = { key: "", rules: (
    /** @type {TermRule[]} */
    []
  ) };
  function customRules(words) {
    const key = words.join("\n");
    if (key !== customCache.key) {
      customCache = {
        key,
        rules: words.map(
          (word, i) => compileTermRule("multi", {
            id: `custom-${i}`,
            category: "custom",
            weight: 1,
            // Le pluriel est pris aussi : on ne demande pas à l'utilisateur d'y penser.
            terms: [.../* @__PURE__ */ new Set([word, `${word}s`, `${word}es`, `${word}x`])],
            note: ""
          })
        )
      };
    }
    return customCache.rules;
  }
  var WORD_START = "(?<![\\p{L}\\p{N}_])";
  var WORD_END = "(?![\\p{L}\\p{N}_])";
  var OPENS_WORD = /^(?:[\p{L}\d_]|\[(?!\^|\\[sS])|\((?!\?[=!<])|\\[pw])/u;
  var unicodeBoundaries = (pattern) => pattern.replace(/(?<!\\)\\b/g, (_, offset) => OPENS_WORD.test(pattern.slice(offset + 2)) ? WORD_START : WORD_END);
  function compilePattern(entry) {
    const flags = entry.flags.includes("u") ? entry.flags : `${entry.flags}u`;
    return new RegExp(unicodeBoundaries(entry.pattern), flags);
  }
  var PATTERN_RULES = Object.entries(LISTS).flatMap(
    ([lang, list]) => list.patterns.map((entry) => ({ lang, entry, re: compilePattern(entry) }))
  );
  var langMatches = (ruleLang, lang) => lang === "auto" || ruleLang === "multi" || ruleLang === lang;
  function findTerm(rule, text, masked) {
    const m = rule.exact.exec(text);
    if (m) return { term: m[1], span: m.indices?.[1] };
    const glued = rule.glued?.exec(text);
    if (glued) return { term: glued[1], via: "glued" };
    for (const token of masked) {
      const term = rule.masked.find((t2) => maskedEquals(token, t2));
      if (term) return { term: term.join(""), via: "masked" };
    }
    return null;
  }
  function matchTerms(text, lang, rules) {
    const hits = [];
    const masked = maskedTokens(text);
    for (const rule of rules) {
      if (!langMatches(rule.lang, lang)) continue;
      const { entry } = rule;
      const found = findTerm(rule, text, masked);
      if (!found) continue;
      const weight = found.via === "masked" ? Math.round(entry.weight * MASKED_WEIGHT * 1e3) / 1e3 : entry.weight;
      hits.push({
        layer: "blocklist",
        id: entry.id,
        termOrPattern: found.term,
        span: found.span,
        weight,
        category: entry.category,
        gated: entry.requireAttackCompanion === true,
        via: found.via
      });
    }
    return hits;
  }
  function matchPatterns(text, lang) {
    const hits = [];
    for (const { lang: ruleLang, entry, re } of PATTERN_RULES) {
      if (!langMatches(ruleLang, lang)) continue;
      const m = re.exec(text);
      if (!m) continue;
      hits.push({
        layer: "pattern",
        id: entry.id,
        termOrPattern: entry.pattern,
        span: [m.index, m.index + m[0].length],
        weight: entry.weight,
        category: entry.category,
        gated: false
      });
    }
    return hits;
  }
  function collectHits(text, lang, termRules) {
    const best = /* @__PURE__ */ new Map();
    [text, ...textVariants(text)].forEach((variant, i) => {
      for (const hit of [...matchTerms(variant, lang, termRules), ...matchPatterns(variant, lang)]) {
        if (i > 0) {
          hit.span = void 0;
          hit.via ??= "norm";
        }
        const previous = best.get(hit.id);
        if (!previous || hit.weight > previous.weight) best.set(hit.id, hit);
      }
    });
    const hits = [...best.values()];
    const hasCompanion = hits.some((h2) => !h2.gated);
    return hits.filter((h2) => !h2.gated || hasCompanion);
  }
  function severityOf(score) {
    if (score < 0.2) return "none";
    if (score < 0.5) return "low";
    if (score < 0.75) return "medium";
    return "high";
  }
  function actionOf(score, sensitivity) {
    const t2 = THRESHOLDS[sensitivity] ?? THRESHOLDS.medium;
    if (score >= t2.collapse) return "collapse";
    if (score >= t2.blur) return "blur";
    return "pass";
  }
  function rankCategories(hits) {
    const totals = /* @__PURE__ */ new Map();
    for (const h2 of hits) totals.set(h2.category, (totals.get(h2.category) ?? 0) + h2.weight);
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([category]) => category);
  }
  function scoreText({
    text,
    lang = "auto",
    sensitivity = "medium",
    categories = DEFAULT_CATEGORIES,
    customTerms = [],
    mutedRules = []
  }) {
    const enabled = /* @__PURE__ */ new Set([...categories, "custom"]);
    const muted = new Set(mutedRules);
    const rules = customTerms.length ? [...TERM_RULES, ...customRules(customTerms)] : TERM_RULES;
    const hits = text.trim() ? collectHits(text, lang, rules).filter((h2) => enabled.has(h2.category) && !muted.has(h2.id)) : [];
    const score = Math.min(
      1,
      hits.reduce((sum, h2) => sum + h2.weight, 0)
    );
    const action = actionOf(score, sensitivity);
    return {
      match: action !== "pass",
      action,
      score: Math.round(score * 1e3) / 1e3,
      severity: severityOf(score),
      categories: rankCategories(hits),
      matches: hits.map(({ layer, id, termOrPattern, span, weight }) => ({ layer, id, termOrPattern, span, weight })),
      reasonLocal: text.trim() ? hits.map((h2) => `${h2.layer}:${h2.id}${h2.via ? `~${h2.via}` : ""}`).join(", ") || "no_hit" : "empty",
      version: VERSION
    };
  }

  // extension/i18n.js
  var t = (key, ...substitutions) => chrome.i18n.getMessage(key, substitutions.map(String)) || key;
  var plural = (key, count2) => t(`${key}${count2 > 1 ? "Many" : "One"}`, count2);
  var categoryLabel = (category) => t(`category_${category}`);

  // extension/settings.js
  var SENSITIVITIES = ["low", "medium", "high"];
  var MAX_CUSTOM_TERMS = 200;
  var MAX_TERM_LENGTH = 60;
  var DEFAULT_SETTINGS = {
    enabled: true,
    categories: DEFAULT_CATEGORIES,
    sensitivity: "medium",
    allowedHandles: [],
    customTerms: [],
    mutedRules: []
  };
  var SETTING_KEYS = (
    /** @type {(keyof Settings)[]} */
    Object.keys(DEFAULT_SETTINGS)
  );
  var CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));
  var SENSITIVITY_IDS = new Set(SENSITIVITIES);
  function parseHandles(value) {
    const items = Array.isArray(value) ? value : String(value ?? "").split(/[\s,;]+/);
    const handles = items.map((h2) => String(h2).trim().replace(/^@/, "").toLowerCase()).filter((h2) => /^\w{1,15}$/.test(h2));
    return [...new Set(handles)];
  }
  function parseTerms(value) {
    const items = Array.isArray(value) ? value : String(value ?? "").split("\n");
    const terms = items.map((term) => String(term).trim().replace(/\s+/g, " ").toLowerCase()).filter((term) => term.length >= 2 && term.length <= MAX_TERM_LENGTH);
    return [...new Set(terms)].slice(0, MAX_CUSTOM_TERMS);
  }
  function sanitizeSettings(raw) {
    const categories = Array.isArray(raw.categories) ? (
      /** @type {Category[]} */
      raw.categories.filter((c) => CATEGORY_IDS.has(c))
    ) : DEFAULT_SETTINGS.categories;
    const sensitivity = (
      /** @type {Sensitivity} */
      SENSITIVITY_IDS.has(
        /** @type {Sensitivity} */
        raw.sensitivity
      ) ? raw.sensitivity : DEFAULT_SETTINGS.sensitivity
    );
    return {
      enabled: raw.enabled !== false,
      categories,
      sensitivity,
      allowedHandles: parseHandles(raw.allowedHandles ?? []),
      customTerms: parseTerms(raw.customTerms ?? []),
      mutedRules: Array.isArray(raw.mutedRules) ? [...new Set(raw.mutedRules.filter((id) => typeof id === "string" && /^[a-z0-9-]{1,64}$/.test(id)))] : []
    };
  }
  async function loadSettings() {
    return sanitizeSettings(await chrome.storage.local.get(DEFAULT_SETTINGS));
  }
  function saveSettings(changes) {
    return chrome.storage.local.set(changes);
  }

  // extension/stats.js
  var STATS_KEY = "stats";
  var KEEP_DAYS = 30;
  var FLUSH_DELAY_MS = 2e3;
  var dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  var pending = {};
  var flushTimer = 0;
  var asStats = (value) => (
    /** @type {Stats} */
    value && typeof value === "object" ? value : {}
  );
  async function flush() {
    const batch = pending;
    pending = {};
    const stats = asStats((await chrome.storage.local.get(STATS_KEY))[STATS_KEY]);
    for (const [day, counts] of Object.entries(batch)) {
      stats[day] ??= {};
      for (const [category, n] of Object.entries(counts)) stats[day][category] = (stats[day][category] ?? 0) + n;
    }
    const oldest = dayKey(new Date(Date.now() - KEEP_DAYS * 864e5));
    for (const day of Object.keys(stats)) if (day < oldest) delete stats[day];
    await chrome.storage.local.set({ [STATS_KEY]: stats });
  }
  function recordHidden(category) {
    const day = dayKey(/* @__PURE__ */ new Date());
    pending[day] ??= {};
    pending[day][category] = (pending[day][category] ?? 0) + 1;
    window.clearTimeout(flushTimer);
    flushTimer = window.setTimeout(flush, FLUSH_DELAY_MS);
  }
  async function readStats(days) {
    const stats = asStats((await chrome.storage.local.get(STATS_KEY))[STATS_KEY]);
    const since = dayKey(new Date(Date.now() - (days - 1) * 864e5));
    const byCategory = {};
    let total = 0;
    for (const [day, counts] of Object.entries(stats)) {
      if (day < since) continue;
      for (const [category, n] of Object.entries(counts)) {
        byCategory[category] = (byCategory[category] ?? 0) + n;
        total += n;
      }
    }
    return { total, byCategory };
  }

  // extension/ui/panel.css
  var panel_default = `/* Panneau des réglages, injecté dans la popup et dans le Shadow DOM du compteur. */

.panel {
  --background: #fff;
  --surface: #f4f4f5;
  --border: #e4e4e7;
  --border-strong: #d4d4d8;
  --text: #18181b;
  --text-muted: #52525b;
  --text-faint: #71717a;
  --accent: #27272a;
  --accent-text: #fff;
  --bar: #e4e4e7;
  --focus: #2563eb;
  --radius: 10px;

  box-sizing: border-box;
  width: 320px;
  padding: 14px 16px;
  background: var(--background);
  color: var(--text);
  font:
    13px/1.4 system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    "Helvetica Neue",
    Arial,
    sans-serif;
  text-align: left;
}

.panel.is-dark {
  --background: #15171a;
  --surface: #1f2226;
  --border: #2f3336;
  --border-strong: #3f4448;
  --text: #e7e9ea;
  --text-muted: #a1a1aa;
  --text-faint: #8b8f96;
  --accent: #e7e9ea;
  --accent-text: #0f1419;
  --bar: #33373c;
}

.panel *,
.panel *::before,
.panel *::after {
  box-sizing: border-box;
}

.panel p {
  margin: 0;
}

.panel__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel__header > div:first-child {
  flex: 1;
}

.panel__title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.panel__subtitle {
  color: var(--text-faint);
  font-size: 12px;
}

.panel__close {
  padding: 4px 10px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.panel__close:hover {
  color: var(--text);
}

.panel__state {
  margin: 6px 0 12px !important;
  color: var(--text-muted);
  font-size: 12px;
}

.panel__footer {
  margin-top: 10px !important;
  color: var(--text-faint);
  font-size: 11px;
}

/* Quand Voyou est coupé, les réglages restent modifiables mais s'effacent. */
.panel.is-off .section,
.panel.is-off .stats {
  opacity: 0.5;
}

.section {
  display: block;
  margin: 0 0 12px;
  padding: 0;
  border: none;
}

.section[hidden] {
  display: none;
}

.section__title {
  display: block;
  margin-bottom: 6px;
  padding: 0;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.section__hint {
  display: block;
  margin-top: 6px;
  color: var(--text-faint);
  font-size: 11px;
}

/* Infos */

.stats {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: var(--radius);
  background: var(--surface);
}

.stats__page {
  margin-bottom: 8px !important;
  font-weight: 600;
}

.stats__total {
  font-weight: 600;
}

.stats__bars {
  display: grid;
  gap: 4px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.stats__bars:empty {
  display: none;
}

.stats__bar {
  display: flex;
  justify-content: space-between;
  padding: 2px 6px;
  border-radius: 4px;
  background: linear-gradient(to right, var(--bar) calc(var(--share) * 100%), transparent 0);
  font-size: 11px;
}

/* Filtres */

.toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
}

.toggle + .toggle {
  margin-top: 4px;
}

.toggle__text {
  display: flex;
  flex-direction: column;
}

.toggle__label {
  font-weight: 600;
}

.toggle__description {
  color: var(--text-faint);
  font-size: 11px;
  line-height: 1.3;
}

.toggle__input {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--accent);
  cursor: pointer;
}

/* Sensibilité */

.segmented {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 3px;
  border-radius: var(--radius);
  background: var(--surface);
}

.segmented__option {
  position: relative;
  padding: 6px 0;
  border-radius: 7px;
  color: var(--text-muted);
  font-weight: 500;
  text-align: center;
  cursor: pointer;
}

.segmented__option input {
  position: absolute;
  opacity: 0;
}

.segmented__option:has(input:checked) {
  background: var(--background);
  color: var(--text);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.segmented__option:has(input:focus-visible) {
  outline: 2px solid var(--focus);
}

/* Listes saisies */

.panel textarea {
  display: block;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  background: var(--background);
  color: var(--text);
  font:
    12px/1.5 ui-monospace,
    SFMono-Regular,
    Menlo,
    monospace;
  resize: vertical;
}

.panel textarea:focus-visible,
.toggle__input:focus-visible,
.panel__close:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 1px;
}

/* Règles ignorées */

.muted {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.muted__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 12px;
}

.muted__restore {
  flex-shrink: 0;
  padding: 2px 8px;
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  background: transparent;
  color: var(--text);
  font: inherit;
  cursor: pointer;
}

/* Interrupteur général : une vraie case à cocher, invisible, posée sur le dessin. */

.switch {
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 24px;
}

.switch input {
  position: absolute;
  z-index: 1;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.switch__track {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: #a1a1aa;
  transition: background 160ms ease;
}

.switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--background);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  transition: transform 160ms ease;
}

.switch input:checked + .switch__track {
  background: var(--accent);
}

.switch input:checked ~ .switch__thumb {
  transform: translateX(20px);
}

.switch input:focus-visible + .switch__track {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .switch__track,
  .switch__thumb {
    transition: none;
  }
}
`;

  // extension/ui/panel.js
  var STATS_DAYS = 7;
  var TYPING_DELAY_MS = 400;
  function h(tag, { className, text, attrs } = {}, children = []) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== void 0) el.textContent = text;
    for (const [name, value] of Object.entries(attrs ?? {})) el.setAttribute(name, value);
    el.append(...children);
    return el;
  }
  var RULES = new Map(
    Object.values(LISTS).flatMap((list) => [
      ...list.terms.map((e) => (
        /** @type {const} */
        [e.id, `${categoryLabel(e.category)} : « ${e.terms[0]} »`]
      )),
      ...list.patterns.map((e) => (
        /** @type {const} */
        [e.id, `${categoryLabel(e.category)} : ${e.note}`]
      ))
    ])
  );
  function bindList(input, parse, save, format) {
    let timer = 0;
    input.addEventListener("input", () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => save(parse(input.value)), TYPING_DELAY_MS);
    });
    input.addEventListener("blur", () => {
      input.value = parse(input.value).map(format).join("\n");
    });
  }
  async function mountPanel(root, { pageCount, onClose, dark }) {
    let settings2 = await loadSettings();
    root.append(h("style", { text: panel_default }));
    const enabled = h("input", { attrs: { type: "checkbox", role: "switch", "aria-label": t("popupToggle") } });
    const header = h("header", { className: "panel__header" }, [
      h("div", {}, [
        h("p", { className: "panel__title", text: "Voyou" }),
        h("p", { className: "panel__subtitle", text: t("popupSubtitle") })
      ]),
      h("label", { className: "switch", attrs: { title: t("popupToggle") } }, [
        enabled,
        h("span", { className: "switch__track", attrs: { "aria-hidden": "true" } }),
        h("span", { className: "switch__thumb", attrs: { "aria-hidden": "true" } })
      ])
    ]);
    if (onClose) {
      const close = h("button", { className: "panel__close", text: t("panelClose"), attrs: { type: "button" } });
      close.addEventListener("click", onClose);
      header.append(close);
    }
    const state = h("p", { className: "panel__state", attrs: { "aria-live": "polite" } });
    const pageLine = h("p", { className: "stats__page" });
    const total = h("p", { className: "stats__total" });
    const bars = h("ul", { className: "stats__bars" });
    const stats = h("section", { className: "stats", attrs: { "aria-live": "polite" } }, [
      ...pageCount ? [pageLine] : [],
      h("p", { className: "section__title", text: t("popupStats") }),
      total,
      bars
    ]);
    const filters = h("fieldset", { className: "section" }, [
      h("legend", { className: "section__title", text: t("popupHide") })
    ]);
    for (const category of CATEGORIES) {
      const input = h("input", { className: "toggle__input", attrs: { type: "checkbox" } });
      input.checked = settings2.categories.includes(category.id);
      input.addEventListener("change", () => {
        const on = new Set(settings2.categories);
        if (input.checked) on.add(category.id);
        else on.delete(category.id);
        saveSettings({ categories: CATEGORIES.map((c) => c.id).filter((id) => on.has(id)) });
      });
      filters.append(
        h("label", { className: "toggle" }, [
          h("span", { className: "toggle__text" }, [
            h("span", { className: "toggle__label", text: categoryLabel(category.id) }),
            h("span", { className: "toggle__description", text: t(`category_${category.id}_description`) })
          ]),
          input
        ])
      );
    }
    const levels = h("div", { className: "segmented" });
    const radioName = `voyou-sensitivity-${Math.random().toString(36).slice(2)}`;
    for (const level of SENSITIVITIES) {
      const radio = h("input", { attrs: { type: "radio", name: radioName, value: level } });
      radio.checked = settings2.sensitivity === level;
      radio.addEventListener("change", () => saveSettings({ sensitivity: level }));
      levels.append(h("label", { className: "segmented__option" }, [radio, t(`sensitivity_${level}`)]));
    }
    const sensitivity = h("fieldset", { className: "section" }, [
      h("legend", { className: "section__title", text: t("popupSensitivity") }),
      levels,
      h("p", { className: "section__hint", text: t("popupSensitivityHint") })
    ]);
    const textArea = (field, placeholder) => h("textarea", { attrs: { rows: "2", spellcheck: "false", autocomplete: "off", placeholder, "data-field": field } });
    const custom = textArea("custom", "");
    const allowed2 = textArea("allowed", "@compte");
    const textSection = (title, area, hint) => h("label", { className: "section" }, [
      h("span", { className: "section__title", text: t(title) }),
      area,
      h("span", { className: "section__hint", text: t(hint) })
    ]);
    custom.value = settings2.customTerms.join("\n");
    allowed2.value = settings2.allowedHandles.map((handle) => `@${handle}`).join("\n");
    bindList(
      custom,
      parseTerms,
      (customTerms) => saveSettings({ customTerms }),
      (v) => v
    );
    bindList(
      allowed2,
      parseHandles,
      (allowedHandles) => saveSettings({ allowedHandles }),
      (v) => `@${v}`
    );
    const mutedList = h("ul", { className: "muted" });
    const muted = h("section", { className: "section" }, [
      h("p", { className: "section__title", text: t("popupMuted") }),
      mutedList,
      h("p", { className: "section__hint", text: t("popupMutedHint") })
    ]);
    const el = h("section", { className: "panel", attrs: { "aria-label": "Voyou" } }, [
      header,
      state,
      stats,
      filters,
      sensitivity,
      textSection("popupCustom", custom, "popupCustomHint"),
      textSection("popupAllowed", allowed2, "popupAllowedHint"),
      muted,
      h("p", { className: "panel__footer", text: t("popupFooter") })
    ]);
    root.append(el);
    enabled.addEventListener("change", () => saveSettings({ enabled: enabled.checked }));
    function renderState() {
      enabled.checked = settings2.enabled;
      state.textContent = settings2.enabled ? t("popupOn") : t("popupOff");
      el.classList.toggle("is-off", !settings2.enabled);
    }
    function renderMuted() {
      muted.hidden = settings2.mutedRules.length === 0;
      mutedList.replaceChildren(
        ...settings2.mutedRules.map((id) => {
          const restore = h("button", {
            className: "muted__restore",
            text: t("popupMutedRestore"),
            attrs: { type: "button" }
          });
          restore.addEventListener(
            "click",
            () => saveSettings({ mutedRules: settings2.mutedRules.filter((rule) => rule !== id) })
          );
          return h("li", { className: "muted__item" }, [h("span", { text: RULES.get(id) ?? id }), restore]);
        })
      );
    }
    async function renderStats() {
      const week = await readStats(STATS_DAYS);
      total.textContent = week.total ? plural("popupStatsTotal", week.total) : t("popupStatsEmpty");
      const max = Math.max(1, ...Object.values(week.byCategory));
      bars.replaceChildren(
        ...Object.entries(week.byCategory).sort((a, b) => b[1] - a[1]).map(([category, count2]) => {
          const bar = h("li", { className: "stats__bar" }, [
            h("span", { text: categoryLabel(category) }),
            h("span", { text: String(count2) })
          ]);
          bar.style.setProperty("--share", String(count2 / max));
          return bar;
        })
      );
    }
    function refreshCount() {
      if (pageCount) pageLine.textContent = `${t("panelPage")} : ${plural("hudCount", pageCount())}`;
    }
    function setDark(value) {
      el.classList.toggle("is-dark", value);
    }
    chrome.storage.onChanged.addListener(async (changes, area) => {
      if (area !== "local") return;
      if (changes.stats) renderStats();
      if (!(changes.enabled || changes.mutedRules || changes.allowedHandles || changes.customTerms)) return;
      settings2 = await loadSettings();
      renderState();
      renderMuted();
      const active = root instanceof ShadowRoot ? root.activeElement : document.activeElement;
      if (active !== allowed2) allowed2.value = settings2.allowedHandles.map((handle) => `@${handle}`).join("\n");
      if (active !== custom) custom.value = settings2.customTerms.join("\n");
    });
    setDark(dark);
    renderState();
    renderMuted();
    refreshCount();
    renderStats();
    return { el, refreshCount, setDark };
  }

  // extension/content/hud.css
  var hud_default = `/* Module flottant sur X, dans un Shadow DOM : les styles de X ne l'atteignent pas. */

:host {
  all: initial;
}

.hud {
  position: relative;
  font:
    13px/1.4 system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    "Helvetica Neue",
    Arial,
    sans-serif;
}

.hud__pill {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 14px 0 10px;
  border: 1px solid rgba(212, 212, 216, 0.9);
  border-radius: 999px;
  background: rgba(250, 250, 250, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow:
    0 4px 20px rgba(24, 24, 27, 0.12),
    0 1px 3px rgba(24, 24, 27, 0.06);
  color: #18181b;
  font: inherit;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  touch-action: none;
  transition: transform 160ms ease;
}

.hud__pill:hover {
  transform: scale(1.03);
}

.hud__pill:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.hud.is-dragging .hud__pill {
  cursor: grabbing;
  transform: scale(1.03);
}

.hud.is-off .hud__pill {
  opacity: 0.6;
}

.hud__dots {
  display: block;
  width: 12px;
  height: 12px;
  color: #a1a1aa;
}

.hud__dots circle {
  fill: currentColor;
}

/* Le panneau s'ouvre du côté où il y a de la place (data-v, data-h). */

.hud__panel {
  position: absolute;
  overflow: auto;
  border-radius: 16px;
  box-shadow:
    0 16px 48px rgba(24, 24, 27, 0.22),
    0 2px 6px rgba(24, 24, 27, 0.08);
  overscroll-behavior: contain;
}

.hud__panel[hidden] {
  display: none;
}

.hud[data-v="up"] .hud__panel {
  bottom: calc(100% + 10px);
}

.hud[data-v="down"] .hud__panel {
  top: calc(100% + 10px);
}

.hud[data-h="right"] .hud__panel {
  right: 0;
}

.hud[data-h="left"] .hud__panel {
  left: 0;
}

.hud[data-v="up"][data-h="right"] .hud__panel {
  transform-origin: bottom right;
}

.hud[data-v="up"][data-h="left"] .hud__panel {
  transform-origin: bottom left;
}

.hud[data-v="down"][data-h="right"] .hud__panel {
  transform-origin: top right;
}

.hud[data-v="down"][data-h="left"] .hud__panel {
  transform-origin: top left;
}

.hud__panel .panel {
  border-radius: 16px;
}

.hud__panel.is-opening {
  animation: voyou-open 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.hud__panel.is-closing {
  animation: voyou-close 140ms ease-in forwards;
}

@keyframes voyou-open {
  from {
    opacity: 0;
    transform: scale(0.88);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes voyou-close {
  to {
    opacity: 0;
    transform: scale(0.92);
  }
}

/* Thème sombre de X. */

.hud.is-dark .hud__pill {
  border-color: rgba(47, 51, 54, 0.9);
  background: rgba(22, 24, 28, 0.92);
  color: #e7e9ea;
}

.hud.is-dark .hud__panel {
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.6),
    0 0 0 1px #2f3336;
}

@media (prefers-reduced-motion: reduce) {
  .hud__pill {
    transition: none;
  }

  .hud__panel.is-opening,
  .hud__panel.is-closing {
    animation: none;
  }
}
`;

  // extension/content/hud.js
  var POSITION_KEY = "hudPosition";
  var MARGIN = 8;
  var DRAG_THRESHOLD = 4;
  var SVG = "http://www.w3.org/2000/svg";
  var host = null;
  var hud = null;
  var pill = null;
  var label = null;
  var panelBox = null;
  var panel = null;
  var count = 0;
  var open = false;
  function dots() {
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("class", "hud__dots");
    svg.setAttribute("viewBox", "0 0 12 12");
    svg.setAttribute("aria-hidden", "true");
    for (const cy of [2, 6, 10]) {
      for (const cx of [3, 9]) {
        const dot = document.createElementNS(SVG, "circle");
        dot.setAttribute("cx", String(cx));
        dot.setAttribute("cy", String(cy));
        dot.setAttribute("r", "1.2");
        svg.append(dot);
      }
    }
    return svg;
  }
  function render() {
    if (!host || !pill || !label) return;
    label.textContent = count > 0 ? plural("hudCount", count) : "Voyou";
    pill.setAttribute("aria-label", `${t("hudOpen")} (${plural("hudCount", count)})`);
    pill.setAttribute("aria-expanded", String(open));
    host.dataset.count = String(count);
    host.dataset.open = String(open);
    panel?.refreshCount();
  }
  function moveTo(left, top) {
    if (!host) return { left, top };
    const rect = host.getBoundingClientRect();
    const position = {
      left: Math.min(Math.max(MARGIN, left), Math.max(MARGIN, innerWidth - rect.width - MARGIN)),
      top: Math.min(Math.max(MARGIN, top), Math.max(MARGIN, innerHeight - rect.height - MARGIN))
    };
    Object.assign(host.style, { left: `${position.left}px`, top: `${position.top}px`, right: "auto", bottom: "auto" });
    return position;
  }
  function placePanel() {
    if (!host || !hud || !panelBox) return;
    const rect = host.getBoundingClientRect();
    const up = rect.top + rect.height / 2 > innerHeight / 2;
    hud.dataset.v = up ? "up" : "down";
    hud.dataset.h = rect.left + rect.width / 2 > innerWidth / 2 ? "right" : "left";
    panelBox.style.maxHeight = `${Math.max(200, (up ? rect.top : innerHeight - rect.bottom) - 2 * MARGIN - 10)}px`;
  }
  function openPanel() {
    if (!panelBox || open) return;
    open = true;
    placePanel();
    panelBox.hidden = false;
    panelBox.classList.remove("is-closing");
    panelBox.classList.add("is-opening");
    render();
  }
  function closePanel() {
    if (!panelBox || !open) return;
    open = false;
    const box = panelBox;
    box.classList.remove("is-opening");
    box.classList.add("is-closing");
    const hide = () => {
      if (open) return;
      box.hidden = true;
      box.classList.remove("is-closing");
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) hide();
    else box.addEventListener("animationend", hide, { once: true });
    render();
    pill?.focus();
  }
  function enableInteractions() {
    if (!host || !hud || !pill) return;
    const hostEl = host;
    const hudEl = hud;
    const pillEl = pill;
    let press = null;
    pillEl.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const rect = hostEl.getBoundingClientRect();
      press = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, moved: false };
      pillEl.setPointerCapture(event.pointerId);
    });
    pillEl.addEventListener("pointermove", (event) => {
      if (!press) return;
      const dx = event.clientX - press.x;
      const dy = event.clientY - press.y;
      if (!press.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      press.moved = true;
      hudEl.classList.add("is-dragging");
      moveTo(press.left + dx, press.top + dy);
      if (open) placePanel();
    });
    pillEl.addEventListener("pointerup", () => {
      if (!press) return;
      const { moved } = press;
      press = null;
      hudEl.classList.remove("is-dragging");
      if (moved) {
        const rect = hostEl.getBoundingClientRect();
        chrome.storage.local.set({ [POSITION_KEY]: moveTo(rect.left, rect.top) });
      } else if (open) closePanel();
      else openPanel();
    });
    pillEl.addEventListener("pointercancel", () => {
      press = null;
      hudEl.classList.remove("is-dragging");
    });
    pillEl.addEventListener("click", (event) => {
      if (event.detail !== 0) return;
      if (open) closePanel();
      else openPanel();
    });
    const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    pillEl.addEventListener("keydown", (event) => {
      const direction = arrows[event.key];
      if (!direction) return;
      event.preventDefault();
      const step = event.shiftKey ? 20 : 8;
      const rect = hostEl.getBoundingClientRect();
      chrome.storage.local.set({
        [POSITION_KEY]: moveTo(rect.left + direction[0] * step, rect.top + direction[1] * step)
      });
      if (open) placePanel();
    });
    document.addEventListener(
      "pointerdown",
      (event) => {
        if (open && !event.composedPath().includes(hostEl)) closePanel();
      },
      true
    );
    document.addEventListener("keydown", (event) => {
      if (open && event.key === "Escape") closePanel();
    });
    addEventListener("resize", () => {
      if (hostEl.style.left) moveTo(hostEl.getBoundingClientRect().left, hostEl.getBoundingClientRect().top);
      if (open) placePanel();
    });
  }
  async function initHud({ dark }) {
    host = document.createElement("div");
    host.id = "voyou-hud";
    Object.assign(host.style, { position: "fixed", right: "16px", bottom: "16px", zIndex: "2147483000" });
    const shadow = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = hud_default;
    label = document.createElement("span");
    pill = document.createElement("button");
    pill.type = "button";
    pill.className = "hud__pill";
    pill.append(dots(), label);
    panelBox = document.createElement("div");
    panelBox.className = "hud__panel";
    panelBox.hidden = true;
    hud = document.createElement("div");
    hud.className = "hud";
    hud.dataset.v = "up";
    hud.dataset.h = "right";
    hud.append(panelBox, pill);
    shadow.append(style, hud);
    (document.body ?? document.documentElement).append(host);
    panel = await mountPanel(panelBox, { pageCount: () => count, onClose: closePanel, dark });
    setHudTheme(dark);
    enableInteractions();
    const saved = (
      /** @type {{ left?: unknown, top?: unknown } | undefined} */
      (await chrome.storage.local.get(POSITION_KEY))[POSITION_KEY]
    );
    if (typeof saved?.left === "number" && typeof saved?.top === "number") moveTo(saved.left, saved.top);
    render();
  }
  function setHudCount(n) {
    count = n;
    render();
  }
  function setHudEnabled(on) {
    hud?.classList.toggle("is-off", !on);
  }
  function setHudTheme(dark) {
    hud?.classList.toggle("is-dark", dark);
    panel?.setDark(dark);
  }

  // extension/content/x-dom.js
  var TWEET = 'article[data-testid="tweet"], article:not([data-testid])';
  var NOTIFICATION = '[data-testid="notification"]';
  var TWEET_TEXT = '[data-testid="tweetText"]';
  var XWEB_TEXT = 'div[dir="auto"]';
  var USER_NAME = '[data-testid="User-Name"]';
  var USER_CELL = '[data-testid="UserCell"]';
  var PROFILE_BIO = '[data-testid="UserDescription"]';
  var PROFILE_NAME = '[data-testid="UserName"]';
  var UNIT_SELECTOR = [TWEET, NOTIFICATION, USER_CELL, PROFILE_BIO, PROFILE_NAME].join(", ");
  var OBSERVER_ROOTS = ['[data-testid="primaryColumn"]', 'main[role="main"]', "main", "#react-root"];
  var RESERVED_PATHS = /* @__PURE__ */ new Set([
    "home",
    "explore",
    "search",
    "i",
    "settings",
    "messages",
    "notifications",
    "compose",
    "login",
    "signup",
    "tos",
    "privacy",
    "intent",
    "hashtag",
    "share"
  ]);
  function cleanHandle(value) {
    const handle = value?.trim().replace(/^@/, "") ?? "";
    if (!/^\w{1,15}$/.test(handle) || RESERVED_PATHS.has(handle.toLowerCase())) return null;
    return handle;
  }
  function handleFromHref(href, profileOnly = false) {
    const m = href?.match(profileOnly ? /^\/(\w{1,15})\/?$/ : /^\/(\w{1,15})(?:[/?]|$)/);
    return m ? cleanHandle(m[1]) : null;
  }
  var BLOCK_TAGS = /* @__PURE__ */ new Set(["DIV", "P", "LI", "BR"]);
  function readText(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue ?? "";
    if (!(node instanceof Element) || node.matches(".voyou-overlay, .voyou-rehide")) return "";
    if (node.tagName === "IMG") return node.getAttribute("alt") ?? "";
    let text = "";
    for (const child of node.childNodes) text += readText(child);
    return BLOCK_TAGS.has(node.tagName) ? `${text}
` : text;
  }
  var textOf = (el) => readText(el).replace(/\n{2,}/g, "\n").trim();
  function findQuote(unit) {
    for (const text of unit.querySelectorAll(TWEET_TEXT)) {
      const box = text.closest('div[role="link"]');
      if (box instanceof HTMLElement && box !== unit && unit.contains(box)) return box;
    }
    const nested = unit.querySelector("article");
    return nested instanceof HTMLElement ? nested : null;
  }
  function extractText(unit) {
    const quote = unit.matches(TWEET) ? findQuote(unit) : null;
    const parts = [...unit.querySelectorAll(TWEET_TEXT)].filter((n) => !quote?.contains(n)).map(textOf).filter(Boolean);
    if (parts.length) return parts.join("\n");
    if (unit.tagName === "ARTICLE" && !unit.hasAttribute("data-testid")) {
      const isNested = (n) => {
        const outer = n.parentElement?.closest(XWEB_TEXT);
        return !!outer && unit.contains(outer);
      };
      const xweb = [...unit.querySelectorAll(XWEB_TEXT)].filter((n) => !n.closest("a") && !isNested(n) && n.closest("article") === unit).map(textOf).filter(Boolean);
      if (xweb.length) return xweb.join("\n");
    }
    return textOf(unit);
  }
  function extractQuoteText(quote) {
    const parts = [...quote.querySelectorAll(TWEET_TEXT)].map(textOf).filter(Boolean);
    if (parts.length) return parts.join("\n");
    return [...quote.querySelectorAll(XWEB_TEXT)].filter((n) => !n.closest("a")).map(textOf).filter(Boolean).join("\n");
  }
  function extractDisplayName(unit) {
    const scope = unit.querySelector(USER_NAME) ?? unit;
    for (const a of scope.querySelectorAll('a[href^="/"]')) {
      if (!handleFromHref(a.getAttribute("href"))) continue;
      const name = textOf(a);
      if (name && !name.startsWith("@")) return name;
    }
    return "";
  }
  function unitKind(el) {
    if (el.matches(TWEET)) return "tweet";
    if (el.matches(NOTIFICATION)) return "notification";
    if (el.matches(USER_CELL)) return "user";
    if (el.matches(PROFILE_BIO)) return "bio";
    return "profile-name";
  }
  var profileHandle = () => handleFromHref(location.pathname);
  function extractAuthor(unit) {
    if (unit.matches(`${PROFILE_BIO}, ${PROFILE_NAME}`)) return profileHandle();
    for (const scope of [unit.querySelector(USER_NAME), unit]) {
      if (!scope) continue;
      for (const a of scope.querySelectorAll('a[href^="/"]')) {
        const handle = handleFromHref(a.getAttribute("href"));
        if (handle) return handle;
      }
    }
    return null;
  }
  function unitKey(unit) {
    const kind = unitKind(unit);
    if (kind === "user" || kind === "bio" || kind === "profile-name") return `${kind}:${extractAuthor(unit) ?? "?"}`;
    for (const a of unit.querySelectorAll('a[href*="/status/"]')) {
      const id = a.getAttribute("href")?.match(/\/status\/(\d+)/)?.[1];
      if (id) return `status:${id}`;
    }
    return `${kind}:${extractAuthor(unit) ?? "?"}:${extractText(unit).slice(0, 80)}`;
  }
  function findObserverRoot() {
    for (const selector of OBSERVER_ROOTS) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return document.documentElement;
  }
  function isUnit(el) {
    if (el.matches(TWEET)) return !el.parentElement?.closest("article");
    if (el.matches(NOTIFICATION)) return !el.querySelector(TWEET);
    if (el.matches(USER_CELL)) return !el.closest("article");
    if (el.matches(PROFILE_BIO)) return !el.closest(USER_CELL);
    return el.matches(PROFILE_NAME);
  }
  function unitOf(el) {
    let node = el.closest(UNIT_SELECTOR);
    while (node) {
      if (node instanceof HTMLElement && isUnit(node)) return node;
      node = node.parentElement?.closest(UNIT_SELECTOR) ?? null;
    }
    return null;
  }
  function findUnits(root) {
    const units = [];
    if (root instanceof HTMLElement && isUnit(root)) units.push(root);
    for (const el of root.querySelectorAll(UNIT_SELECTOR)) {
      if (el instanceof HTMLElement && isUnit(el)) units.push(el);
    }
    return units;
  }

  // extension/content/own-handles.js
  var STORAGE_KEY = "ownHandles";
  var REFRESH_MS = 5e3;
  var SWITCHER = '[data-testid="SideNav_AccountSwitcher_Button"]';
  var NAV = 'nav, header[role="banner"]';
  var ACCOUNT_AREAS = `${SWITCHER}, ${NAV}`;
  var PROFILE_LINK = `a[data-testid="AppTabBar_Profile_Link"], :is(${NAV}) a[aria-label="Profil" i], :is(${NAV}) a[aria-label="Profile" i]`;
  var OWN_NOTIFICATION_TEXT = /ont aimé votre post|a répondu à votre|a cité votre|votre post|votre réponse|reposted your|liked your/i;
  var ownHandles = /* @__PURE__ */ new Set();
  function mergeHandles(candidates) {
    const byLower = /* @__PURE__ */ new Map();
    for (const candidate of candidates) {
      const handle = cleanHandle(candidate);
      if (handle && !byLower.has(handle.toLowerCase())) byLower.set(handle.toLowerCase(), handle);
    }
    return [...byLower.values()];
  }
  function setOwnHandles(handles) {
    ownHandles = new Set(mergeHandles(handles).map((h2) => h2.toLowerCase()));
  }
  function detectLoggedInHandle() {
    const profileLink = document.querySelector(PROFILE_LINK);
    const fromProfileLink = handleFromHref(profileLink?.getAttribute("href") ?? null);
    if (fromProfileLink) return fromProfileLink;
    const switcher = document.querySelector(SWITCHER);
    if (switcher) {
      const label2 = `${switcher.textContent ?? ""} ${switcher.getAttribute("aria-label") ?? ""}`;
      const fromLabel = cleanHandle(label2.match(/@(\w{1,15})/)?.[1]);
      if (fromLabel) return fromLabel;
    }
    for (const nav of document.querySelectorAll(NAV)) {
      for (const a of nav.querySelectorAll('a[href^="/"]')) {
        const handle = handleFromHref(a.getAttribute("href"), true);
        if (handle) return handle;
      }
    }
    for (const avatar of document.querySelectorAll('[data-testid^="UserAvatar-Container-"]')) {
      if (!avatar.closest(ACCOUNT_AREAS)) continue;
      const handle = cleanHandle(avatar.getAttribute("data-testid")?.slice("UserAvatar-Container-".length));
      if (handle) return handle;
    }
    return null;
  }
  async function refreshOwnHandles() {
    const stored = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
    const known = Array.isArray(stored) ? stored : [];
    const handles = mergeHandles([...known, detectLoggedInHandle()]);
    const before = [...ownHandles].sort().join();
    setOwnHandles(handles);
    if (handles.join() !== known.join()) await chrome.storage.local.set({ [STORAGE_KEY]: handles });
    return [...ownHandles].sort().join() !== before;
  }
  async function initOwnHandles(onChange) {
    await refreshOwnHandles();
    const tick = () => refreshOwnHandles().then((changed) => changed && onChange());
    setTimeout(tick, 400);
    setTimeout(tick, 1500);
    setInterval(tick, REFRESH_MS);
  }
  function applyStoredHandles(handles) {
    setOwnHandles(Array.isArray(handles) ? handles : []);
  }
  function isOwnHandle(handle) {
    const clean = cleanHandle(handle);
    return !!clean && ownHandles.has(clean.toLowerCase());
  }
  function isOwnContent(unit, author) {
    if (isOwnHandle(author)) return true;
    const inNotification = !!unit.closest(NOTIFICATION);
    const onNotificationsPage = location.pathname.startsWith("/notifications");
    if ((inNotification || onNotificationsPage) && OWN_NOTIFICATION_TEXT.test(unit.textContent ?? "")) return true;
    if (!inNotification) return false;
    for (const a of unit.querySelectorAll('a[href*="/status/"]')) {
      if (isOwnHandle(a.getAttribute("href")?.match(/^\/(\w{1,15})\/status\//)?.[1])) return true;
    }
    return false;
  }

  // extension/content/treat.js
  var STATE = "data-voyou-state";
  var KEY = "data-voyou-key";
  var TARGET = "data-voyou-target";
  var COMPACT = "data-voyou-compact";
  var UI_SELECTOR = ".voyou-overlay, .voyou-rehide";
  var COMPACT_HEIGHT = 72;
  var hiddenKeys = /* @__PURE__ */ new Set();
  var revealedKeys = /* @__PURE__ */ new Set();
  var boundElements = /* @__PURE__ */ new WeakSet();
  var listeners = /* @__PURE__ */ new Set();
  var actions = { notHate: () => {
  }, allow: () => {
  } };
  function setActions(handlers) {
    actions = handlers;
  }
  function onHiddenCountChange(listener) {
    listeners.add(listener);
  }
  var hiddenCount = () => hiddenKeys.size;
  function notify() {
    for (const listener of listeners) listener(hiddenKeys.size);
  }
  var isHiddenKey = (key) => hiddenKeys.has(key);
  var isTreated = (el) => el.hasAttribute(STATE);
  function forgetHidden() {
    hiddenKeys.clear();
    notify();
  }
  function forgetKey(key) {
    revealedKeys.delete(key);
    if (hiddenKeys.delete(key)) notify();
  }
  function markTargets(el) {
    const hidden = el.getAttribute(STATE) === "hidden";
    for (const child of el.children) {
      if (child.matches(UI_SELECTOR)) continue;
      child.setAttribute(TARGET, "");
      child.toggleAttribute("aria-hidden", hidden);
    }
  }
  function setState(el, state) {
    const key = el.getAttribute(KEY);
    el.setAttribute(STATE, state);
    markTargets(el);
    if (!key) return;
    const sizeBefore = hiddenKeys.size;
    if (state === "hidden") {
      hiddenKeys.add(key);
      revealedKeys.delete(key);
    } else {
      hiddenKeys.delete(key);
      revealedKeys.add(key);
    }
    if (hiddenKeys.size !== sizeBefore) notify();
  }
  function button(action, label2, title, primary = false) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = primary ? "voyou-btn" : "voyou-btn voyou-btn--ghost";
    el.dataset.voyouAction = action;
    el.textContent = label2;
    if (title) el.title = title;
    return el;
  }
  function ensureUi(el) {
    if (!el.querySelector(":scope > .voyou-overlay")) {
      const overlay = document.createElement("div");
      overlay.className = "voyou-overlay";
      const reason = document.createElement("p");
      reason.className = "voyou-reason";
      overlay.append(button("reveal", t("reveal"), void 0, true), reason);
      el.append(overlay);
    }
    if (!el.hasAttribute(COMPACT) && !el.querySelector(":scope > .voyou-rehide")) {
      const bar = document.createElement("div");
      bar.className = "voyou-rehide";
      const rehide = button("rehide", t("rehide"));
      rehide.setAttribute("aria-label", t("rehideLabel"));
      bar.append(
        button("not-hate", t("notHate"), t("notHateTitle")),
        button("allow", "", t("allowAccountTitle")),
        rehide
      );
      el.append(bar);
    }
    if (boundElements.has(el)) return;
    boundElements.add(el);
    el.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest("[data-voyou-action]") : null;
      if (!target || target.closest(`[${STATE}]`) !== el) return;
      event.preventDefault();
      event.stopPropagation();
      switch (target.getAttribute("data-voyou-action")) {
        case "reveal":
          setState(el, "revealed");
          break;
        case "rehide":
          setState(el, "hidden");
          el.querySelector(":scope > .voyou-overlay button")?.focus();
          break;
        case "not-hate":
          actions.notHate(el);
          break;
        case "allow": {
          const handle = el.dataset.voyouAuthor;
          if (handle) actions.allow(handle);
          break;
        }
      }
    });
  }
  function treat(el, key, { reason, author }) {
    if (!isTreated(el)) el.toggleAttribute(COMPACT, el.getBoundingClientRect().height < COMPACT_HEIGHT);
    el.setAttribute(KEY, key);
    if (author) el.dataset.voyouAuthor = author;
    ensureUi(el);
    const reasonEl = el.querySelector(":scope > .voyou-overlay .voyou-reason");
    if (reasonEl && reasonEl.textContent !== reason) reasonEl.textContent = reason;
    const allow = el.querySelector(':scope > .voyou-rehide [data-voyou-action="allow"]');
    if (allow instanceof HTMLElement) {
      allow.hidden = !author;
      if (author) allow.textContent = t("allowAccount", author);
    }
    setState(el, revealedKeys.has(key) ? "revealed" : "hidden");
  }
  function untreat(el) {
    if (!isTreated(el)) return;
    for (const ui of el.querySelectorAll(`:scope > :is(${UI_SELECTOR})`)) ui.remove();
    for (const child of el.querySelectorAll(`:scope > [${TARGET}]`)) {
      child.removeAttribute(TARGET);
      child.removeAttribute("aria-hidden");
    }
    for (const attr of [STATE, KEY, COMPACT, "data-voyou-author"]) el.removeAttribute(attr);
  }
  function untreatAll() {
    for (const el of document.querySelectorAll(`[${STATE}]`)) {
      if (el instanceof HTMLElement) untreat(el);
    }
  }

  // extension/content/main.js
  var MAX_TEXT_LENGTH = 4e3;
  var RESCAN_DELAY_MS = 16;
  var SAFETY_RESCAN_MS = 3e3;
  var settings = sanitizeSettings({});
  var allowed = /* @__PURE__ */ new Set();
  var settingsVersion = 0;
  var rescanTimer = 0;
  var verdicts = /* @__PURE__ */ new WeakMap();
  var applied = /* @__PURE__ */ new WeakMap();
  var counted = /* @__PURE__ */ new Set();
  function applySettings(next) {
    settings = next;
    allowed = new Set(next.allowedHandles);
    settingsVersion++;
  }
  function judge(source, text) {
    const cached = verdicts.get(source);
    if (cached?.text === text && cached.version === settingsVersion) return cached;
    const result = scoreText({
      text: text.slice(0, MAX_TEXT_LENGTH),
      sensitivity: settings.sensitivity,
      categories: settings.categories,
      customTerms: settings.customTerms,
      mutedRules: settings.mutedRules
    });
    const verdict = {
      text,
      version: settingsVersion,
      category: result.match ? result.categories[0] : null,
      ruleIds: result.matches.map((m) => m.id)
    };
    verdicts.set(source, verdict);
    return verdict;
  }
  function apply(el, key, verdict, author) {
    if (verdict?.category) {
      applied.set(el, verdict);
      if (!counted.has(key)) {
        counted.add(key);
        recordHidden(verdict.category);
      }
      treat(el, key, { reason: categoryLabel(verdict.category), author });
    } else if (isHiddenKey(key)) {
      treat(el, key, { reason: "", author });
    } else {
      untreat(el);
    }
  }
  function processUnit(unit) {
    const key = unitKey(unit);
    const kind = unitKind(unit);
    const author = extractAuthor(unit);
    const quote = kind === "tweet" ? findQuote(unit) : null;
    if (isOwnContent(unit, author) || author && allowed.has(author.toLowerCase())) {
      forgetKey(key);
      untreat(unit);
      if (quote) untreat(quote);
      return;
    }
    const text = extractText(unit);
    let verdict = text ? judge(unit, text) : null;
    const nameBlock = kind === "tweet" ? unit.querySelector('[data-testid="User-Name"]') : null;
    const name = kind === "tweet" && !verdict?.category ? extractDisplayName(unit) : "";
    if (name) {
      const byName = judge(nameBlock ?? unit.querySelector("a") ?? unit, name);
      if (byName.category) verdict = byName;
    }
    apply(unit, key, verdict, author);
    if (!quote) return;
    if (unit.getAttribute("data-voyou-state") === "hidden") {
      untreat(quote);
      return;
    }
    const quoteText = extractQuoteText(quote);
    apply(quote, `quote:${key}`, quoteText ? judge(quote, quoteText) : null, extractAuthor(quote));
  }
  function syncTheme() {
    const background = getComputedStyle(document.body ?? document.documentElement).backgroundColor;
    const [r = 255, g = 255, b = 255, alpha = 1] = background.match(/[\d.]+/g)?.map(Number) ?? [];
    const dark = alpha > 0 && 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
    const theme = dark ? "dark" : "light";
    if (document.documentElement.dataset.voyouTheme === theme) return;
    document.documentElement.dataset.voyouTheme = theme;
    setHudTheme(dark);
  }
  function scan() {
    syncTheme();
    if (!settings.enabled) return;
    findUnits(document).forEach(processUnit);
  }
  function scheduleScan() {
    window.clearTimeout(rescanTimer);
    rescanTimer = window.setTimeout(scan, RESCAN_DELAY_MS);
  }
  function onMutations(mutations) {
    if (!settings.enabled) return;
    let rescan = false;
    for (const mutation of mutations) {
      if (mutation.type === "characterData" || mutation.removedNodes.length) rescan = true;
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        findUnits(node).forEach(processUnit);
        const parent = node.parentElement;
        const unit = parent && isTreated(parent) ? unitOf(parent) : null;
        if (unit) processUnit(unit);
      }
    }
    if (rescan) scheduleScan();
  }
  async function onStorageChange(changes) {
    if (changes.ownHandles) {
      applyStoredHandles(changes.ownHandles.newValue);
      scheduleScan();
    }
    if (!SETTING_KEYS.some((key) => key in changes)) return;
    applySettings(await loadSettings());
    setHudEnabled(settings.enabled);
    forgetHidden();
    untreatAll();
    scan();
  }
  setActions({
    // Désactive, pour cet utilisateur seulement, les règles qui ont masqué ce message.
    notHate(el) {
      const ruleIds = (applied.get(el)?.ruleIds ?? []).filter((id) => !id.startsWith("custom-"));
      if (ruleIds.length) saveSettings({ mutedRules: [.../* @__PURE__ */ new Set([...settings.mutedRules, ...ruleIds])] });
    },
    allow(handle) {
      saveSettings({ allowedHandles: [.../* @__PURE__ */ new Set([...settings.allowedHandles, handle.toLowerCase()])] });
    }
  });
  function warmUpDetector() {
    const samples = ["warm up", "sale b*ugnoule 🐒", "vuelve a tu país", "você é um idiota", "kys 4 r34l"];
    const run = () => samples.forEach((text) => scoreText({ text }));
    if (typeof requestIdleCallback === "function") requestIdleCallback(() => [1, 2, 3].forEach(run));
    else window.setTimeout(() => [1, 2, 3].forEach(run), 0);
  }
  async function start() {
    document.documentElement.dataset.voyou = "actif";
    warmUpDetector();
    applySettings(await loadSettings());
    await initOwnHandles(scheduleScan);
    syncTheme();
    await initHud({ dark: document.documentElement.dataset.voyouTheme === "dark" });
    setHudEnabled(settings.enabled);
    setHudCount(hiddenCount());
    onHiddenCountChange(setHudCount);
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local") onStorageChange(changes);
    });
    scan();
    new MutationObserver(onMutations).observe(findObserverRoot(), {
      childList: true,
      subtree: true,
      characterData: true
    });
    setInterval(scheduleScan, SAFETY_RESCAN_MS);
    addEventListener("popstate", scheduleScan);
  }
  start();
})();
