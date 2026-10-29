"use strict";
(() => {
  // extension/manifest.json
  var manifest_default = {
    manifest_version: 3,
    name: "Voyou",
    version: "0.4.0",
    description: "__MSG_extDescription__",
    default_locale: "fr",
    minimum_chrome_version: "110",
    permissions: ["storage"],
    host_permissions: ["https://x.com/*", "https://twitter.com/*"],
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

  // extension/detection/categories.js
  var CATEGORIES = [
    { id: "racism", enabledByDefault: true },
    { id: "hate", enabledByDefault: true },
    { id: "threat", enabledByDefault: true },
    { id: "insult", enabledByDefault: true },
    { id: "profanity", enabledByDefault: false }
  ];
  var DEFAULT_CATEGORIES = CATEGORIES.filter((c) => c.enabledByDefault).map((c) => c.id);

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
          "kos omak",
          "kos ommak",
          "ibn el kalb",
          "ya kalb",
          "ya 7mar",
          "ya hmar"
        ],
        note: "Insultes, écrites en lettres latines. « kos omak » est aussi reconnu collé (« kosomak »)."
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
        pattern: "(?<![\\p{L}])(?:[وفب]|يا)?(?:زنجي[ةه]?|زنوج|كحلوش[ةه]?)(?![\\p{L}])",
        flags: "iu",
        note: "Insultes racistes visant les Noirs. Le « يا » peut être collé au mot (« يازنجي »)."
      },
      {
        id: "pat-ar-abd",
        category: "racism",
        weight: 0.8,
        pattern: "(?<![\\p{L}])يا\\s*عبد(?:\\s+يا(?![\\p{L}])|(?!\\s*[\\p{L}\\p{M}]))",
        flags: "iu",
        note: "« يا عبد » (esclave) adressé à quelqu'un : seul, devant une ponctuation ou devant un autre « يا » (« يا عبد يا حقير »). Suivi d'un autre mot, c'est souvent un prénom composé (« يا عبد الله », « يا عبد ربه ») : il passe. « عبيد » n'y est pas : c'est aussi le prénom Obaid."
      },
      {
        id: "pat-ar-monkey",
        category: "racism",
        weight: 0.75,
        pattern: "(?<![\\p{L}])(?:يا\\s*|ا?نت[اي]?\\s+)قرد[ةه]?(?![\\p{L}])(?!\\s*يا\\s*(?:حبيب|روح|قلب|عمر))",
        flags: "iu",
        note: "Comparaison au singe (« يا قرد », « انت قرد »). Suivi d'un mot tendre (« يا قرد يا حبيبي »), c'est un surnom donné à un enfant et il passe."
      },
      {
        id: "pat-ar-go-home",
        category: "racism",
        weight: 0.75,
        pattern: "(?<![\\p{L}])(?<!(?<![\\p{L}])(?:أنا|نفسي|بدي|ودي|أبغى|أبي|عايز|عاوز|حابب|أريد|أتمنى|أن|لازم|سوف|راح|رح|متى|لما|عندما|حين|ما|مش|لن|لم)\\s)(?:[وف]?ارجع(?:ي|وا)?\\s+(?:(?:ل|إلى\\s+|على\\s+)?(?:بلدك|بلادك|بلدكم|بلادكم|أفريقيا)|(?:إلى\\s+|على\\s+)?الغابة|للغابة)|روح(?:وا)?\\s+(?:ل|إلى\\s+|على\\s+)(?:بلدك|بلادك|بلدكم|بلادكم))(?![\\p{L}])",
        flags: "iu",
        note: "Renvois vers le pays de la personne (« ارجع لبلدك »), l'Afrique ou la jungle. Après « روح », qui veut aussi dire « âme », la préposition est obligatoire. « أرجع » est aussi la première personne : après نفسي, لازم ou بدي (« نفسي أرجع لأفريقيا »), il passe."
      },
      {
        id: "pat-ar-sectarian",
        category: "hate",
        weight: 0.85,
        pattern: "(?<![\\p{L}])(?:[وفب]?(?:ال)?|لل)(?:روافض|نصيري[ةه])(?![\\p{L}])|(?<![\\p{L}])[وفب]?ال(?:رافضي|ناصبي)(?![\\p{L}])|(?<![\\p{L}])(?:يا\\s*|أنت\\s+|هذا\\s+)(?:رافضي|ناصبي)(?![\\p{L}])(?!\\s*ال)|(?<![\\p{L}])يا\\s*(?:رافض[ةه]|نواصب)(?:\\s+يا(?![\\p{L}])|(?!\\s*[\\p{L}\\p{M}]))|(?:(?<!ال(?!له\\s)\\p{L}+\\s)(?<![\\p{L}])[وفب]?ال|(?<![\\p{L}])لل)رافض[ةه](?![\\p{L}])(?!\\s*ل(?!عن))",
        flags: "iu",
        note: "Insultes confessionnelles. « رافضة » et « رافضي » veulent aussi dire « qui refuse » (« الحكومة رافضة للقرار », « رافضي الخدمة ») : ils ne comptent qu'avec l'article ou adressés sans complément (« يا رافضي », mais pas « يا رافضي الحق »). « الرافضة » ne compte ni derrière un nom défini (« الأطراف الرافضة ») ni devant un complément en ل. « نصيري » (mon soutien, et un nom de famille) n'y est pas, et « نواصب » (terme de grammaire) ne compte qu'adressé."
      },
      {
        id: "pat-ar-antisemitism",
        category: "hate",
        weight: 0.9,
        pattern: "أحفاد\\s+القرد[ةه]\\s+والخنازير|(?<![\\p{L}])يا\\s*يهودي(?![\\p{L}])",
        flags: "iu",
        note: "Cliché antisémite, « يهودي » employé comme insulte. Le mot seul passe."
      },
      {
        id: "pat-ar-lgbt",
        category: "hate",
        weight: 0.85,
        pattern: "(?<![\\p{L}])[وفب]?(?:لوطي[ةه]?|الخول)(?![\\p{L}])|(?<![\\p{L}])(?:يا\\s*|ا?نت[اي]?\\s+)(?:خول|زامل)(?![\\p{L}])|(?<![\\p{L}])(?:ده|دا)\\s+خول(?![\\p{L}])",
        flags: "iu",
        note: "Insultes homophobes. « خول » et « زامل » ne comptent qu'adressés (« يا خول », « انت زامل ») ou, pour « خول », avec l'article : seuls, ce sont aussi le verbe « autoriser » (« خوّل »), « être coéquipier de » et le chant yéménite."
      },
      {
        id: "pat-ar-sexism",
        category: "hate",
        weight: 0.6,
        pattern: "(?<![\\p{L}])(?:مكانك|مكانكم|(?:المرأ[ةه]|البنت|الست|الحرم[ةه])\\s+مكانها)\\s+(?:في\\s+|[بف])?(?:ال)?مطبخ(?![\\p{L}])",
        flags: "iu",
        note: "Sexisme (« مكانك في المطبخ », « المرأة مكانها المطبخ »). « مكانها » seul passe : c'est aussi la place d'un objet (« رجع الصحون مكانها في المطبخ »)."
      },
      {
        id: "pat-ar-insults",
        category: "insult",
        weight: 0.8,
        pattern: "(?<![\\p{L}])[وفب]?(?:شرموط[ةه]?|قحب[ةه]|كسمك|كس\\s+أمك)(?![\\p{L}])|(?<![\\p{L}])(?:يا\\s*)?ا?بن\\s+(?:الكلب|الشرموط[ةه]|القحب[ةه]|الحرام)(?![\\p{L}])|(?<![\\p{L}])يا\\s*(?:كلب|حمار|خنزير|حيوان)(?![\\p{L}])",
        flags: "iu",
        note: "Insultes, avec « يا » collé compris (« ياكلب », « يابن الكلب »)."
      },
      {
        id: "pat-ar-threat",
        category: "threat",
        weight: 0.85,
        pattern: "(?<![\\p{L}])(?:سأقتلك|سوف\\s+أقتلك|راح\\s+أقتلك|رح\\s+أقتلك|بقتلك|حقتلك|نقتلك|الله\\s+ياخذك|إن\\s+شاء\\s+الله\\s+تموت|يجب\\s+قتلهم|لازم\\s+يموتوا)(?![\\p{L}])|\\b(?:n9atlek|n9telk|nqatlek|bnqtlk)\\b",
        flags: "iu",
        note: "Menaces."
      },
      {
        id: "pat-ar-profanity",
        category: "profanity",
        weight: 0.5,
        pattern: "(?<![\\p{L}])[وفب]?(?:زبي?|تفو)(?![\\p{L}])",
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
        terms: ["schlitzauge", "schlitzaugen", "ölauge", "ölaugen", "oelauge", "oelaugen", "olauge", "olaugen"],
        note: "Insultes racistes, aussi écrites sans tréma. « Kameltreiber » (aussi le chamelier) est dans pat-de-racism."
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
        terms: ["spast", "spasten", "spastis", "missgeburt"],
        note: "Handicap utilisé comme insulte. « spasti » est dans pat-de-ableist : en serbe, croate et bosnien, c'est le verbe « sauver »."
      },
      {
        id: "bl-de-insults",
        category: "insult",
        weight: 0.7,
        terms: [
          "arschloch",
          "arschlöcher",
          "arschloecher",
          "arschlocher",
          "hurensohn",
          "hurensöhne",
          "hurensoehne",
          "hurensohne",
          "wichser",
          "vollidiot",
          "drecksau"
        ],
        note: "Insultes, aussi écrites sans tréma."
      },
      {
        id: "bl-de-profanity",
        category: "profanity",
        weight: 0.5,
        terms: ["scheiße", "scheisse", "scheiß", "scheiss", "verfickt", "kacke"],
        note: "Jurons, masqués seulement si le filtre vulgarité est activé."
      }
    ],
    patterns: [
      {
        id: "pat-de-racism",
        category: "racism",
        weight: 0.8,
        pattern: "\\b(?:kanak(?:en?|in(?:nen)?)|neger(?:in(?:nen)?)?|zigeunerpack|negerpack)\\b|\\b(?:du|ihr)(?<!t\\s+(?:du|ihr))\\s+kameltreiber\\b|\\bschei(?:ß|ss)\\s+kameltreiber\\b",
        flags: "iu",
        note: "Insultes racistes, au masculin et au féminin. « Kameltreiber » est aussi le chamelier des voyages : seulement avec « Scheiß » ou adressé (« du Kameltreiber »), pas après un verbe conjugué (« habt ihr Kameltreiber gesehen? »)."
      },
      {
        id: "pat-de-insult",
        category: "insult",
        weight: 0.6,
        pattern: "\\b(?:abschaum|gesindel)\\b|\\b(?:du|ihr)(?<!t\\s+(?:du|ihr))\\s+ungeziefer\\b|\\b(?:bist|seid|sind\\s+(?:alle|doch|nur))\\s+(?:alle\\s+|nur\\s+)?ungeziefer\\b",
        flags: "iu",
        note: "Déshumanisation. « Ungeziefer » désigne aussi les nuisibles du jardin : seulement dit de personnes (« ihr seid Ungeziefer », « die sind doch alle Ungeziefer »). « Hast du Ungeziefer? » et « welche Tiere sind Ungeziefer? » passent."
      },
      {
        id: "pat-de-threat",
        category: "threat",
        weight: 0.8,
        pattern: "\\bgeh(?:ö|oe)ren\\s+(?:alle\\s+)?(?:vergast|erschossen)\\b|\\b(?:die|solche)\\s+geh(?:ö|oe)ren\\s+(?:alle\\s+)?(?:aufgeh(?:ä|ae)ngt|ausgerottet)\\b|\\b(?:ich\\s+töte|töte\\s+ich)\\s+dich\\b(?!\\s+nicht\\b)|\\bich\\s+wei(?:ß|ss)[\\s,]+wo\\s+du\\s+wohnst\\b|\\bich\\s+finde\\s+dich[\\s,]+und\\s+(?:dann\\s+)?(?:bist\\s+du\\s+dran|mach(?:\\s+ich)?\\s+dich\\s+(?:fertig|kalt)|töte\\s+dich)\\b|\\bbringe?\\s+(?:ich\\s+)?dich\\s+(?:doch\\s+)?um(?=[^\\S\\n]*(?:$|\\n|[^\\s\\p{L}\\p{N}]|(?:du|und|wenn|sobald|ich)\\b))|\\bhoffentlich\\s+(?:stirbst|verreckst)\\s+du\\b(?!\\s+(?:nicht|nie|niemals)\\b)",
        flags: "iu",
        note: "Menaces et appels à tuer. « bring dich um » seulement en fin de proposition : « um acht » (à huit heures) et « um den Verstand » passent. « Ich finde dich toll », « … gehören abgeschafft » et les négations (« hoffentlich stirbst du nicht ») passent aussi. « aufgehängt » (le linge) et « ausgerottet » (les moustiques) seulement après « die » ou « solche »."
      },
      {
        id: "pat-de-go-home",
        category: "racism",
        weight: 0.8,
        pattern: "(?<!\\bich\\s+)\\bgeh\\s+(?:doch\\s+)?(?:zurück|heim)\\s+(?:(?:in|nach)\\s+deine?s?\\s+(?:land|heimatland|heimat)|nach\\s+afrika)\\b|\\bgeht\\s+(?:doch\\s+)?(?:zurück|heim)\\s+(?:in|nach)\\s+eu(?:er|re)s?\\s+(?:land|heimatland|heimat)\\b|(?<!\\bich\\s+)\\bhau\\s+(?:doch\\s+)?ab\\s+(?:nach\\s+afrika|in\\s+die\\s+heimat)\\b|\\bab\\s+(?:nach\\s+afrika|in\\s+die\\s+heimat)\\s+mit\\s+(?:dir|euch|denen|ihnen)\\b|\\bausländer\\s+raus\\b|\\bdeutschland\\s+den\\s+deutschen\\b",
        flags: "iu",
        note: "Renvois adressés. La 3e personne (« sie geht zurück in ihr Heimatland ») et la 1re (« ich hau ab nach Afrika ») passent, comme « ab nach Hause », « ab in die Heimat » et « ab nach Afrika » (un voyage) sans « mit dir »."
      },
      {
        id: "pat-de-dirty",
        category: "racism",
        weight: 0.85,
        pattern: "\\bdreckige?[rns]?\\s+(?:kanak(?:en?|in(?:nen)?)|türk(?:en?|in(?:nen)?)|(?:ausländer|araber|neger|zigeuner|afrikaner)(?:in(?:nen)?)?|kameltreiber)\\b",
        flags: "iu",
        note: "« dreckig » + origine, au masculin et au féminin."
      },
      {
        id: "pat-de-religion",
        category: "hate",
        weight: 0.85,
        pattern: "\\bdreckige?[rns]?\\s+(?:juden?|jüdin(?:nen)?|muslim(?:e|in(?:nen)?)?|moslems?)\\b|\\b(?:juden|muslime|moslems)\\s+(?:raus|vergasen)\\b|\\b(?:judenpack|judensau)\\b",
        flags: "iu",
        note: "Haine religieuse, au masculin et au féminin."
      },
      {
        id: "pat-de-jungle",
        category: "racism",
        weight: 0.75,
        pattern: "(?<!\\bich\\s+)\\bgeh\\s+(?:doch\\s+)?zurück\\s+(?:in\\s+den\\s+dschungel|auf\\s+die\\s+bäume)\\b|\\bzurück\\s+(?:in\\s+den\\s+dschungel|auf\\s+die\\s+bäume)\\s+mit\\s+(?:dir|euch|denen|ihnen)\\b",
        flags: "iu",
        note: "Renvoi « dans la jungle » ou « sur les arbres », seulement adressé : le Dschungelcamp (une émission de télé) et les singes qui regagnent leurs arbres passent."
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
        pattern: "\\b(?:zurück|ab)\\s+(?:in\\s+die\\s+küche|an\\s+den\\s+herd)(?:\\s+mit\\s+(?:dir|euch|ihr)\\b|[\\s,]+(?:frau(?:en)?|weib(?:er)?)(?!\\s*[\\p{L}\\p{N}_]))|\\b(?:klappe|maul|fresse)\\s+und\\s+(?:zurück|ab)\\s+(?:in\\s+die\\s+küche|an\\s+den\\s+herd)\\b|\\b(?:frauen|weiber)\\s+geh(?:ö|oe)ren\\s+(?:zurück\\s+)?(?:in\\s+die\\s+küche|an\\s+den\\s+herd)\\b|\\b(?:dumme|blöde|dreckige)\\s+(?:hure|schlampe|fotze)\\b",
        flags: "iu",
        note: "Sexisme. « ab in die Küche » seulement adressé à une femme (« mit dir », « Frau! », « halt die Klappe und… ») : les recettes et les chefs passent, comme « Frau » suivi d'un nom."
      },
      {
        id: "pat-de-ableist",
        category: "hate",
        weight: 0.6,
        pattern: "\\bdu\\s+(?:bist\\s+)?(?:doch\\s+)?(?:behindert|mongo)\\b(?!\\s+(?:bist|warst|wärst|wirst|sein|geboren)\\b)|\\b(?:du|ein|de[mnr]|diese[mnr]|alter)\\s+spasti\\b",
        flags: "iu",
        note: "Handicap utilisé comme insulte. « behindert » seul est un mot neutre, comme « wenn du behindert bist » (le verbe en fin de subordonnée). « spasti » seulement adressé : en serbe, croate et bosnien, c'est le verbe « sauver »."
      },
      {
        id: "pat-de-directed-insult",
        category: "insult",
        weight: 0.6,
        pattern: "\\bdu\\s+(?:bist\\s+(?:ein|eine)\\s+)?(?:idiot|vollidiot|depp|trottel|vollpfosten)\\b|\\bdu(?<!t\\s+du)\\s+(?:bist\\s+ein\\s+)?lappen\\b",
        flags: "iu",
        note: "Insulte adressée. « Hast du Lappen? » (des chiffons) passe : après un verbe conjugué, « du » est le sujet."
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
        terms: ["dirty arab", "dirty arabs", "filthy arab", "filthy arabs", "you arab scum"],
        note: "Insulte ethnique en plusieurs mots."
      },
      {
        id: "bl-en-black-ape",
        category: "racism",
        weight: 0.8,
        terms: ["black ape", "black apes"],
        note: "Comparaison au singe visant les Noirs. Poids 0.8 voulu. « you ape » est dans pat-en-monkey-people : c'est aussi le verbe imiter."
      },
      {
        id: "bl-en-scum-attack",
        category: "insult",
        weight: 0.75,
        terms: [
          "you scum",
          "piece of scum",
          "human scum",
          "worthless scum",
          "filthy scum",
          "these scum",
          "those scum",
          "scum like you",
          "scum like them",
          "scum like that",
          "scum like this"
        ],
        note: "Insultes avec « scum », toujours en plusieurs mots : seul, le mot sert aux titres de presse et à la crasse (soap scum)."
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
        id: "bl-en-1488",
        category: "racism",
        weight: 0.8,
        terms: ["1488"],
        requireAttackCompanion: true,
        note: "Code néonazi, mais aussi une année ou un numéro de commande, dans toutes les langues : ne compte qu'avec une autre règle d'attaque."
      },
      {
        id: "bl-en-ableist",
        category: "hate",
        weight: 0.6,
        terms: ["retarded"],
        note: "Insulte validiste. « retard » est dans pat-en-retard-directed : seul, c'est un mot courant du français."
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
          "pieces of shit",
          "dumbass",
          "dipshit",
          "asshole",
          "assholes",
          "cunt",
          "cunts"
        ],
        note: "Insultes fortes. « jackass » est dans pat-en-directed-insult : c'est aussi le nom d'une émission."
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
        id: "bl-en-coon",
        category: "racism",
        weight: 0.85,
        pattern: "(?<![Mm]aine[\\s\\p{Pd}_]*)(?!Coons?\\b)\\b[Cc][Oo][Oo][Nn][Ss]?\\b(?![\\s\\p{Pd}_]*(?:cats?|kittens?|hounds?|dogs?|hunting|hunters?|skins?)\\b)",
        flags: "u",
        strictDoubles: true,
        note: "Insulte raciste anglaise. « Coon » avec une majuscule (nom propre, chat Maine Coon) et « coon hunting » passent."
      },
      {
        id: "bl-en-spic",
        category: "racism",
        weight: 0.85,
        pattern: "\\bspics?\\b(?![\\s\\p{Pd}_]*(?:and|&|n|'n'?)[\\s\\p{Pd}_]*span\\b)",
        flags: "iu",
        note: "Insulte visant les Latinos. « spic and span » (impeccable) passe."
      },
      {
        id: "bl-en-kike",
        category: "hate",
        weight: 0.9,
        pattern: "(?!Kike\\b)\\b[Kk][IiYy][Kk][Ee][Ss]?\\b",
        flags: "u",
        note: "Insulte antisémite. « Kike » avec une majuscule, diminutif espagnol d'Enrique, passe."
      },
      {
        id: "bl-en-lgbt",
        category: "hate",
        weight: 0.8,
        pattern: "(?<!\\b(?:manual|automatic|auto|rebuilt|rebuild|rebuilding|replaced|replace|swapped|swap)\\s+(?:(?:the|my|a|his|her|new)\\s+)?)\\btrann(?:y|ies)\\b(?![\\s\\p{Pd}_]+(?:fluid|swap|rebuild|cooler|shop|pan|filter|problems?|issues?)\\b)|\\bshemales?\\b|\\b(?:you|ugly|fat|stupid|dumb|filthy|dirty|bull)\\s+dykes?\\b",
        flags: "iu",
        note: "Insultes anti-LGBT. « dyke » compte seulement adressé (fat dyke), « tranny » pour une boîte de vitesses passe."
      },
      {
        id: "pat-en-retard-directed",
        category: "hate",
        weight: 0.6,
        pattern: "\\b(?:you|ur|u|the|these|those|shut\\s+up|bunch\\s+of|fucking|stupid|dumb|little|absolute|complete|full)\\s+retards?\\b|(?:'s|'re|\\bis|\\bare|\\bur|\\bsuch|\\bwhat|\\blike)\\s+an?\\s+(?:(?:fucking|stupid|dumb|little|absolute|complete|total)\\s+)?retard\\b|\\bare\\s+(?:all\\s+)?retards\\b",
        flags: "iu",
        note: "« retard » employé comme insulte (you retard). Seul, c'est un mot courant du français et il passe."
      },
      {
        id: "pat-en-go-back",
        category: "racism",
        weight: 0.75,
        pattern: "(?:(?:^|\\n|[^\\p{L}\\p{N}\\s])[^\\S\\n]*(?:just\\s+|so\\s+|now\\s+)?|\\b(?:you\\s+(?:should|need\\s+to|must|better)|why\\s+don'?t\\s+you)\\s+|@\\w+\\s+)go\\s+back(?:\\s+to)?\\s+(?:africa|mexico|the\\s+jungle|your\\s+(?:own\\s+)?(?:country|shithole))\\b|\\bgo\\s+back(?:\\s+to)?\\s+where\\s+you\\s+came\\s+from\\b",
        flags: "iu",
        note: "Renvoi « go back to… » à l'impératif ou adressé. « can't wait to go back to Mexico » passe."
      },
      {
        id: "pat-en-deport-all",
        category: "racism",
        weight: 0.7,
        pattern: "\\b(?:deport|send\\s+back)\\s+(?:all\\s+(?:the\\s+)?(?:muslims|arabs|immigrants|illegals|blacks)|(?:the\\s+)?(?:muslims|arabs|blacks))\\b",
        flags: "iu",
        note: "Appel à expulser un groupe entier. Une politique décrite (deport immigrants with criminal records) passe."
      },
      {
        id: "pat-en-monkey-people",
        category: "racism",
        weight: 0.7,
        pattern: "(?<!\\b(?:love|miss|thank|see)\\s)\\byou(?:\\s+people\\s+are|\\s+are(?:\\s+all)?|'re(?:\\s+all)?)?\\s+(?:(?:dumb|stupid|filthy|dirty|ugly|fucking)\\s+)?(?:monkeys\\b|apes\\b|gorillas\\b|ape(?!\\s*\\p{L}))|\\b(?:these|those)\\s+people\\s+are\\s+(?:monkeys|apes|gorillas)\\b|\\b(?:these|those)\\s+(?:monkeys|apes|gorillas)\\s+(?:should|need\\s+to|must)\\s+(?:go\\s+back|be\\s+deported)\\b",
        flags: "iu",
        note: "Singe visant des personnes, pas les animaux. « you ape » suivi d'un mot (imiter) passe."
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
        pattern: "(?<!\\b(?:not|saying|say|says|claim|claims|claiming)\\s)\\b(?:all|every)\\s+muslims?\\s+(?:are|is)\\s+(?:an?\\s+)?terrorists?\\b",
        flags: "iu",
        note: "Amalgame musulmans et terroristes. « not all Muslims are terrorists » passe."
      },
      {
        id: "pat-en-dirty-ethnicity",
        category: "racism",
        weight: 0.75,
        pattern: "\\b(?:dirty|filthy)\\s+(?:muslims?|jews?|blacks|black\\s+(?:people|man|men|woman|women|guys?|bastards?|cunts?|scum))\\b|\\byou\\s+(?:dirty|filthy)\\s+black\\b",
        flags: "iu",
        note: "« dirty » + origine. « dirty black jeans » (une couleur) passe."
      },
      {
        id: "pat-en-white-power",
        category: "racism",
        weight: 0.8,
        pattern: "\\b(?:white\\s*power(?![\\s\\p{Pd}_]*(?:cables?|cords?|buttons?|supply|supplies|adapters?|banks?|strips?|bricks?|outlets?|sockets?|plugs?|switch(?:es)?|leds?|lights?|rangers?)\\b)|wpww)\\b",
        flags: "iu",
        note: "Slogans suprémacistes. « white power cable » passe, et 1488 est dans bl-en-1488."
      },
      {
        id: "pat-en-directed-insult",
        category: "insult",
        weight: 0.6,
        pattern: "\\b(?:you(?:'re|\\s+are|\\s+r|\\s+must\\s+be)|youre|ur)\\s+(?:such\\s+)?(?:an?\\s+)?(?:(?:fucking|stupid|total|complete|absolute|dumb|little|ugly)\\s+)?(?:idiots?|morons?|jackass(?:es)?)\\b|(?<!\\b(?:love|miss|thank|see)\\s)\\byou\\s+(?:(?:fucking|stupid|total|complete|absolute|dumb|little|ugly)\\s+)?(?:idiots?|morons?|jackass(?:es)?)\\b|\\bwhat\\s+an?\\s+(?:(?:fucking|stupid|total|complete|absolute|dumb|little|ugly)\\s+)?(?:idiot|moron|jackass)\\b(?!\\s+i\\b)",
        flags: "iu",
        note: "Insulte directe (you're an idiot, what a moron). « what an idiot I am » passe."
      },
      {
        id: "pat-en-bitch-directed",
        category: "insult",
        weight: 0.6,
        pattern: "\\b(?:(?<!\\b(?:love|miss|thank|see)\\s)you|shut\\s+up)\\s+(?:(?:stupid|dumb|ugly|fucking|little|worthless)\\s+)?bitch(?:es)?\\b|\\b(?:you(?:'re|\\s+are)|youre|ur)\\s+(?:such\\s+)?an?\\s+(?:(?:stupid|dumb|ugly|fucking|little|worthless)\\s+)?bitch\\b|\\b(?:stupid|dumb|ugly)\\s+bitch(?:es)?\\b",
        flags: "iu",
        note: "« bitch » adressé comme insulte (shut up bitch). Seul, c'est un juron, et « you lucky bitch » passe."
      },
      {
        id: "pat-en-dehumanize",
        category: "insult",
        weight: 0.6,
        pattern: "(?<!\\b(?:love|miss|thank|see)\\s)\\byou\\s+(?:(?:fucking|filthy|dirty|disgusting|stinking|stupid)\\s+)?(?:vermin|rats|cockroaches|roaches|savages|subhumans?|parasites|animals|pos)\\b|\\b(?:these|those|filthy|dirty)\\s+(?:\\w+\\s+)?(?:vermin|savages|subhumans?)\\b|\\b(?:these|those)\\s+(?:rats|cockroaches|roaches|parasites|animals)\\s+(?:(?:should|need\\s+to|must)\\s+be\\s+deported|(?:are\\s+)?(?:invading\\s+our\\s+(?:country|nation|borders|land)|liv(?:e|ing)\\s+off\\s+(?:welfare|benefits|our\\s+taxes)))\\b",
        flags: "iu",
        note: "Déshumanisation adressée ou visant des personnes (you rats, these vermin). « these rats in my garden » passe."
      },
      {
        id: "pat-en-violence",
        category: "threat",
        weight: 0.6,
        pattern: "\\b(?:kill(?:ing)?|shoot(?:ing)?|hang|gas(?:sing)?|exterminat(?:e|ing))\\s+(?:them|em|'em)\\s+all\\b(?!\\s+(?:with|day|night|week|up|on|over|around)\\b)|\\b(?:kill(?:ing)?|gas(?:sing)?|exterminat(?:e|ing))\\s+all\\s+of\\s+them\\b|\\bgas\\s+(?:them|em|'em)\\b(?!\\s+(?:all\\s+)?up\\b)|\\b(?:kill(?:ing)?|gas(?:sing)?|exterminat(?:e|ing))\\s+(?:all\\s+)?(?:these|those)\\s+(?:\\w+\\s+)?(?:people|savages|subhumans|immigrants|migrants|muslims|jews|blacks|arabs|gays|traitors)\\b|\\b(?:they\\s+(?:all\\s+(?:should|must|need\\s+to|deserve\\s+to)|(?:should|must|need\\s+to|deserve\\s+to)\\s+all)|(?:these|those)\\s+(?:\\w+\\s+)?(?:people|savages|subhumans|immigrants|migrants|muslims|jews|blacks|arabs|gays|traitors)(?:\\s+all)?\\s+(?:should|must|need\\s+to|deserve\\s+to)(?:\\s+all)?)\\s+be\\s+(?:killed|gassed|exterminated|executed|shot)\\b(?!\\s+(?:off|on|in|with|at|for|by|down)\\b)|\\bkick\\s+(?:em|'em|them)\\s+again\\b|\\bkicking\\s+the\\s+shit\\s+out\\s+of\\b|\\bbeat\\s+(?:\\w+\\s+){0,2}into\\s+submission\\b|\\bbullets?\\s+(?:dipped\\s+)?in\\s+pig(?:'?s)?\\s+(?:fat|blood)\\b|\\bpig(?:'?s)?\\s+(?:fat|blood)\\s+bullets?\\b",
        flags: "iu",
        note: "Appels à la violence (kill them all, killing them all, gas them, they should all be killed). « kill them with kindness », « hang them up » et « hanging them all on the tree » passent."
      },
      {
        id: "pat-en-chink",
        category: "racism",
        weight: 0.85,
        pattern: "(?<![\\p{L}\\p{N}])(?:chinks?)(?![\\p{L}\\p{N}])(?!\\s+in\\s+(?:the|his|her|their|its|my|your|our|a)\\s+(?:armou?r|curtains?|clouds?|walls?|fences?|doors?))(?!\\s+of\\s+(?:light|sunlight|daylight|hope|glass(?:es)?|coins?))",
        flags: "iu",
        note: "Insulte visant les Asiatiques. « chink in the armor » et « a chink of light » passent."
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
        pattern: "\\b(?:(?<!\\b(?:don't|dont|do\\s+not|never)\\s)kill\\s+yourself|kys|i(?:'ll|\\s+will|\\s+am\\s+going\\s+to|'?m\\s+(?:gonna|going\\s+to)|\\s+wanna)\\s+(?:(?:kill|hurt|stab)\\s+you|shoot\\s+you(?=\\s*(?:$|[.!,;:])|\\s+(?:dead|in\\s+the\\s+(?:head|face)))|end\\s+you(?=\\s*(?:$|[.!,;:]))|find\\s+you(?=\\s+and\\s+(?:kill|hurt|beat|stab|shoot|end)\\b))|(?:i\\s+)?hope\\s+you\\s+(?:die|get\\s+(?:shot|raped|killed|cancer))|you\\s+(?:should|deserve\\s+to)\\s+(?:die(?!\\s+(?:on|your|ur)\\b)|be\\s+(?:shot|hanged|hung|killed|raped))|i\\s+know\\s+where\\s+you\\s+live)\\b",
        flags: "iu",
        note: "Menaces adressées. « I'll shoot you an email » et « I'll find you a seat » passent."
      },
      {
        id: "pat-en-sexism",
        category: "hate",
        weight: 0.6,
        pattern: "(?:^|\\n|[^\\p{L}\\p{N}\\s]|@\\w+\\s|\\bwomen?\\s|\\byou\\s+(?:should|need\\s+to|must|better)\\s)[^\\S\\n]*(?:now\\s+|just\\s+)?(?:go\\s+back\\s+to|get\\s+back\\s+in(?:to)?)\\s+the\\s+kitchen\\b|(?<!\\b(?:you|u|please|pls)\\s)\\bmake\\s+me\\s+a\\s+sandwich\\b(?!\\s*\\?)|\\bwomen\\s+(?:belong|should\\s+stay)\\s+in\\s+the\\s+kitchen\\b|\\b(?:you|dumb|stupid|fat|ugly)\\s+(?:whore|slut|skank)s?\\b",
        flags: "iu",
        note: "Sexisme. « I need to go back to the kitchen » et « can you make me a sandwich? » passent."
      },
      {
        id: "pat-en-religion-threat",
        category: "hate",
        weight: 0.8,
        pattern: "\\b(?:all|these|those|the)\\s+(?:muslims|jews|christians)\\s+(?:should|must|need\\s+to)\\s+(?:die(?!\\s+to\\b)|be\\s+(?:killed|gassed|deported|exterminated))\\b",
        flags: "iu",
        note: "Appel contre un groupe religieux. « die to self », formule chrétienne, passe."
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
        terms: ["sudaca", "sudacas", "negrata", "negratas", "moraco", "moracos"],
        note: "Insultes racistes."
      },
      {
        id: "bl-es-racism-ambiguous",
        category: "racism",
        weight: 0.9,
        terms: ["panchito", "panchitos", "machupichu", "machupichus"],
        requireAttackCompanion: true,
        note: "Ne compte qu'avec un autre signal d'attaque : « panchitos » (les cacahuètes), le prénom Panchito et « Machupichu » mal écrit doivent passer."
      },
      {
        id: "bl-es-lgbt",
        category: "hate",
        weight: 0.8,
        terms: ["maricón", "maricon", "maricones", "bujarra", "bujarras", "tortillera", "tortilleras"],
        note: "Insultes anti-LGBT. « marica » est exclu : en Colombie il veut souvent dire « mec ». « joto » passe par pat-es-joto."
      },
      {
        id: "bl-es-ableist",
        category: "hate",
        weight: 0.6,
        terms: ["subnormal", "subnormales", "mongólico", "mongolico", "mongólicos", "mongolicos"],
        note: "Insultes validistes. Le féminin passe par pat-es-ableist : « mancha mongólica » est une tache de naissance."
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
          "cabron",
          "cabrona",
          "cabrones",
          "imbécil",
          "mamón"
        ],
        note: "Insultes. Le pluriel « imbéciles » est aussi un mot français courant : il passe par pat-es-directed-insult."
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
        pattern: "(?<![\\p{L}\\p{N}])(?:(?:negr[oa]s?|mor[oa]s?|chin[oa]s?|gitan[oa]s?|sudacas?|indi[oa]s?|panchit[oa]s?|machupichus?|inmigrantes?|extranjer[oa]s?)\\s+de\\s+mierda)(?![\\p{L}\\p{N}])",
        flags: "iu",
        note: "Origine + « de mierda »."
      },
      {
        id: "pat-es-go-home",
        category: "racism",
        weight: 0.75,
        pattern: "\\b(?:vete|vuelve|regresa|vu[eé]lvete|regr[eé]sate|l[aá]rgate)\\s+(?:a|para)\\s+tu\\s+(?:pa[ií]s|tierra|chabola)\\b|\\b(?:volved|largaos)\\s+(?:a|para)\\s+vuestr[oa]\\s+(?:pa[ií]s|tierra)\\b|(?:\\b(?:v[aá]yase|v[aá]yanse|l[aá]rguese|l[aá]rguense|vu[eé]lvase|vu[eé]lvanse|regr[eé]sese|regr[eé]sense)|(?:^|[\\n,.;:!?¡…])[^\\S\\n]*(?:vuelva|vuelvan|regrese|regresen))\\s+(?:a|para)\\s+su\\s+(?:pa[ií]s|tierra)\\b|(?:\\b(?:vete|l[aá]rgate|volved|largaos|vuelvan)|(?:^|[\\n,.;:!?¡…])[^\\S\\n]*(?:vuelve|regresa))\\s+a\\s+(?:[aá]frica|marruecos|la\\s+selva|la\\s+jungla)\\b",
        flags: "iu",
        note: "« vuelve a tu país », « váyanse a su país », « vuelve a África » en début de phrase. « vuelve » et « regresa » sont aussi des 3e personnes : « el presidente regresa a su país » et « vuelve a tu pueblo por Navidad » passent."
      },
      {
        id: "pat-es-fuera",
        category: "racism",
        weight: 0.75,
        pattern: "\\bfuera\\s+(?:los\\s+|las\\s+)?(?:inmigrantes|moros|negros|sudacas|extranjeros|ilegales|musulmanes)\\b",
        flags: "iu",
        note: "« fuera los inmigrantes ». Sans « panchitos » : « fuera los panchitos » se dit aussi des cacahuètes."
      },
      {
        id: "pat-es-monkey",
        category: "racism",
        weight: 0.7,
        pattern: "\\b(?:eres|pareces)\\s+(?:un|una)\\s+(?:mono|simio|gorila|macaco)\\b",
        flags: "iu",
        note: "Personne comparée à un singe. « qué mono », « son monos » et « eres una mona » (mignons) passent."
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
        pattern: "(?<![\\p{L}\\p{N}])(?:(?:jud[ií][oa]s?|musulm[aá]n(?:es|as?)?|cristian[oa]s?)\\s+de\\s+mierda)(?![\\p{L}\\p{N}])|\\brata\\s+jud[ií]a\\b",
        flags: "iu",
        note: "Haine religieuse."
      },
      {
        id: "pat-es-sexism",
        category: "hate",
        weight: 0.6,
        pattern: "(?:\\bvete|(?:(?:^|[\\n,.;:!?¡…])[^\\S\\n]*|\\bc[aá]llate\\s+y\\s+|\\bcalla\\s+y\\s+)(?:vuelve|regresa))\\s+a\\s+la\\s+cocina\\b|(?:^|[\\n,.;:!?¡…])[^\\S\\n]*(?:las\\s+)?mujeres\\s+a\\s+la\\s+cocina\\b|^[^\\p{L}\\p{N}]*a\\s+la\\s+cocina(?!\\s*\\p{L})|\\b(?:zorra|perra|puta)\\s+de\\s+mierda\\b|\\bpinche\\s+(?:vieja|puta|perra)\\b",
        flags: "iu",
        note: "Sexisme. « vete a la cocina », « a la cocina » seul, « vuelve a la cocina » en début de phrase. « voy a la cocina » et « el chef vuelve a la cocina » passent."
      },
      {
        id: "pat-es-ableist",
        category: "hate",
        weight: 0.6,
        pattern: "(?<!\\b(?:si|cuando|aunque)\\s)\\b(?:eres|pareces)\\s+(?:(?:un|una)\\s+autista|(?:(?:un|una)\\s+)?(?:retrasad[oa]|retardad[oa]|mongol[oa]|mong[oó]lica))\\b",
        flags: "iu",
        note: "Handicap utilisé comme insulte. « el tren está retrasado », « efecto retardado », « si eres autista » et « ¿eres autista? » passent."
      },
      {
        id: "pat-es-threat",
        category: "threat",
        weight: 0.8,
        pattern: "\\b(?:(?:te\\s+voy\\s+a\\s+matar|mu[eé]rete|m[aá]tate|ojal[aá]\\s+te\\s+mueras|hay\\s+que\\s+(?:matarlos|fusilarlos|exterminarlos))(?!\\s+(?:de\\s+(?:la\\s+)?(?:risa|amor|envidia|celos|ganas|verg[uü]enza|aburrimiento|viej[oa]|un\\s+susto)|a\\s+(?:besos|abrazos|cosquillas|preguntas|estudiar|trabajar|entrenar)))|te\\s+voy\\s+a\\s+(?:reventar|partir\\s+la\\s+cara)|ojal[aá]\\s+(?:te|os|les)\\s+maten|hay\\s+que\\s+colgarlos(?!\\s+(?:en|al|a\\s+la|con|bien|sobre|del|para)\\b)|(?<!\\b(?:no|nunca|jam[aá]s)\\s(?:se\\s)?)merecen\\s+(?:morir|la\\s+muerte))\\b",
        flags: "iu",
        note: "Menaces. « te voy a buscar », « te voy a matar a besos », « muérete de risa », « no merecen morir » et « colgarlos en la pared » passent."
      },
      {
        id: "pat-es-directed-insult",
        category: "insult",
        weight: 0.6,
        pattern: "\\b(?:eres|sois|panda\\s+de)\\s+(?:(?:un|una|unos|unas)\\s+)?(?:idiotas?|est[uú]pid[oa]s?|in[uú]til(?:es)?|imb[eé]ciles|payas[oa]s?|tont[oa]s?|basura|pedazos?\\s+de\\s+mierda)\\b",
        flags: "iu",
        note: "Insulte adressée (« eres un idiota », « panda de inútiles »)."
      },
      {
        id: "pat-es-joto",
        category: "hate",
        weight: 0.8,
        pattern: "\\b(?:(?:pinches?|put[oa]s?|maldit[oa]s?|asqueros[oa]s?)\\s+|eres\\s+(?:un\\s+|bien\\s+)?|sois\\s+unos\\s+|no\\s+seas\\s+)jotos?\\b",
        flags: "iu",
        note: "« joto » seulement en attaque (« pinche joto ») : c'est aussi « chaleur » en swahili, et un mot revendiqué."
      },
      {
        id: "pat-es-insults-ambiguous",
        category: "insult",
        weight: 0.7,
        pattern: "(?<!\\b(?:su|sus|del)\\s)\\bcapullos?\\b(?!\\s+del?\\s+(?:(?:la|las|una)\\s+)?(?:rosas?|rosal(?:es)?|flor(?:es)?|seda|algod[oó]n))|\\bescorias?\\b(?!\\s+(?:volc[aá]nicas?|sider[uú]rgicas?|del\\s+volc[aá]n|de\\s+(?:alto\\s+horno|fundici[oó]n)))",
        flags: "iu",
        note: "Insultes qui ont aussi un sens courant : « capullo de rosa », « su capullo » (le cocon) et « escoria volcánica » passent."
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
        terms: ["sous-merde", "sous-merdes"],
        note: "Insulte déshumanisante."
      },
      {
        id: "bl-fr-sous-homme",
        category: "insult",
        weight: 0.85,
        terms: ["sous-homme", "sous-hommes"],
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
        terms: ["enfoiré", "enfoire"],
        note: "Insulte. Le pluriel passe par pat-fr-enfoires : « Les Enfoirés » est aussi un spectacle."
      },
      {
        id: "bl-fr-salaud",
        category: "insult",
        weight: 0.8,
        terms: ["salaud", "salauds", "salope", "salopes"],
        note: "Insulte."
      },
      {
        id: "bl-fr-naze",
        category: "insult",
        weight: 0.65,
        terms: ["naze", "nazes"],
        requireAttackCompanion: true,
        note: "Ne compte qu'avec un autre signal d'attaque : « je suis naze » veut aussi dire épuisé."
      },
      {
        id: "bl-fr-boloss",
        category: "insult",
        weight: 0.7,
        terms: ["boloss", "bolosses"],
        strictDoubles: true,
        note: "Insulte. Pas de lettres doublées fabriquées : « bolosss » étiré est le portugais « bolos » (gâteaux)."
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
        requireAttackCompanion: true,
        note: "Ne compte qu'avec un autre signal d'attaque : « les ordures ménagères » doit passer."
      },
      {
        id: "bl-fr-pourri",
        category: "insult",
        weight: 0.65,
        terms: ["pourri", "pourris", "pourrie", "pourries"],
        requireAttackCompanion: true,
        note: "Ne compte qu'avec un autre signal d'attaque : « temps pourri », « fruits pourris » doivent passer."
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
        terms: ["putain", "merde", "bordel", "chier", "foutre", "ta gueule", "fais chier", "fait chier"],
        note: "Jurons, masqués seulement si le filtre vulgarité est activé. « nique » passe par pat-fr-nique."
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
        pattern: "\\b(?:rentre[rz]?|retourne[rz]?)\\s+chez\\s+(?:toi|vous)(?:\\s*[,!]\\s*|\\s+)(?:les?\\s+|la\\s+|l'\\s*|sales?\\s+)?(?:migrants?|immigr[ée]s?|arabes?|noire?s?|bamboulas?|bougnoules?|n[eè]gres?|bicots?|rebeus?|renois|musulmane?s?|[ée]trang[eè]re?s?|envahisseurs?|maghr[ée]bine?s?|africaine?s?|ratons?(?!\\s+laveurs?))\\b|(?:\\bles\\s+|\\bl'|\\bsales?\\s+|(?:^|[^\\p{L}\\p{N}\\s']|\\n|@\\w+\\s|\\btoi\\s)[^\\S\\n]*)(?:migrants?|immigr[ée]s?|arabes?|noire?s?|bamboulas?|bougnoules?|n[eè]gres?|bicots?|rebeus?|renois|musulmane?s?|[ée]trang[eè]re?s?|envahisseurs?|maghr[ée]bine?s?|africaine?s?|ratons?(?!\\s+laveurs?))(?:\\s*[,!:]\\s*|\\s+)(?:rentre[rz]?|retourne[rz]?)\\s+chez\\s+(?:toi|vous)\\b",
        flags: "iu",
        note: "« Rentrez chez vous » à côté du groupe visé (« rentrez chez vous les migrants »). Seul, c'est aussi une consigne de sécurité."
      },
      {
        id: "pat-fr-dehors-etrangers",
        category: "racism",
        weight: 0.7,
        pattern: "\\bdehors\\s+(?:les\\s+)?(?:[ée]trangers|immigr[ée]s|migrants|arabes|noirs|musulmans|juifs|maghr[ée]bins|africains)\\b",
        flags: "iu",
        note: "Slogans d'expulsion (« dehors les étrangers »)."
      },
      {
        id: "pat-fr-singe-people",
        category: "racism",
        weight: 0.7,
        pattern: "\\b(?:vous\\s+[eê]tes\\s+des|sales|(?<!\\bune\\s)bande\\s+de)\\s+(?:singes|gorilles|macaques)\\b|\\b(?:t'?es\\s+(?:qu'\\s*)?un|sale|(?<![\\p{L}\\p{N}]\\s+|')esp[eè]ce\\s+de)\\s+(?:singe|gorille|macaque)\\b|\\b(?:ces|les)\\s+(?:singes|gorilles|macaques)\\s+(?:dehors|rentrez|retournez|dans\\s+leur\\s+jungle)\\b",
        flags: "iu",
        note: "Singe visant des personnes. « 260 espèces de singes », « une bande de singes » et « les singes du parc » passent."
      },
      {
        id: "pat-fr-banane-racial",
        category: "racism",
        weight: 0.55,
        pattern: "\\b(?:lance|jette)[rz]?[\\s-]+(?:lui|leur)\\s+(?:une|des)\\s+bananes?\\b|\\bmange[rsz]?\\s+(?:ta|tes)\\s+bananes?[\\s,]+(?:le|sale|esp[eè]ce\\s+de)\\s+(?:singe|macaque|gorille)\\b",
        flags: "iu",
        note: "Moquerie raciste avec la banane. « mange ta banane » seul (le goûter) passe."
      },
      {
        id: "pat-fr-tous-racailles-immigres",
        category: "racism",
        weight: 0.7,
        pattern: "(?<!\\b(?:que|pas|non)\\s+(?:tous\\s+)?(?:les\\s+)?)\\b(?:immigr[ée]s?|[ée]trangers|migrants)\\s+(?:c'?est|sont)\\s+tous\\s+(?:des\\s+)?racailles\\b",
        flags: "iu",
        note: "Amalgame immigrés et racailles. « dire que les immigrés c'est tous des racailles » passe."
      },
      {
        id: "pat-fr-groupe-essentialisme",
        category: "racism",
        weight: 0.75,
        pattern: "(?<!\\b(?:contre|sur|envers|pour|de|des|aux|pas|que|non|dire)\\s+(?:tous\\s+)?(?:les\\s+)?)\\b(?:les\\s+)?(?:juifs|arabes|noirs|musulmans|immigr[ée]s|migrants|[ée]trangers|roms|gitans|africains|maghr[ée]bins|chinois|asiatiques|blancs|homos)\\s+(?:sont|c'est)\\s+(?:tous\\s+|toutes\\s+)?(?:des\\s+)?(?:animaux|singes|rats|cafards|parasites|vermines?|sauvages|terroristes|voleurs|violeurs|sous[\\s-]hommes|d[ée]linquants|criminels|porcs|chiens)\\b",
        flags: "iu",
        note: "« les noirs sont des animaux », « les musulmans sont tous des terroristes ». « dire que les immigrés sont… » et « ce n'est pas vrai que tous les… » passent."
      },
      {
        id: "pat-fr-retourne-afrique",
        category: "racism",
        weight: 0.7,
        pattern: "(?:^|[^\\p{L}\\p{N}\\s']|\\n|@\\w+\\s|\\btoi\\s)[^\\S\\n]*(?:retourne|retournez|rentre|rentrez|repars|repartez|va|vas)\\s+(?:en\\s+afrique|au\\s+maghreb|au\\s+bled)\\b",
        flags: "iu",
        note: "Renvoi à l'impératif vers l'Afrique, le Maghreb ou le bled, en début de phrase. « la ministre va en Afrique » et « je rentre au bled » passent."
      },
      {
        id: "pat-fr-bled-merde",
        category: "racism",
        weight: 0.55,
        pattern: "\\b(?:ton|ta|tes|votre|vos|leurs?)\\s+(?:bleds?|trous?|pays)\\s+(?:de\\s+|à\\s+)?merde\\b",
        flags: "iu",
        note: "Insulte sur le pays d'origine de quelqu'un (« ton bled de merde »). « ce bled de merde » sur sa propre ville passe."
      },
      {
        id: "pat-fr-babouin-people",
        category: "racism",
        weight: 0.55,
        pattern: "\\b(?:comme\\s+des?|vous\\s+[eê]tes\\s+des|t'?es\\s+(?:qu'\\s*)?un|sales?|(?<!\\bune\\s)bande\\s+de|(?<![\\p{L}\\p{N}]\\s+|')esp[eè]ce\\s+de)\\s+babouins?\\b",
        flags: "iu",
        note: "Babouin visant des personnes (« comme des babouins »). Le babouin du zoo passe."
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
        pattern: "\\b(?:qi|quotient\\s+intellectuel)\\s*(?:faible|bas|d[eé]ficient)\\b.{0,40}\\b(?:musulman|maghr[eé]bin|africain|arabe|noir)e?s?\\b|\\b(?:musulman|maghr[eé]bin|africain|arabe|noir)e?s?\\b.{0,40}\\b(?:qi|quotient\\s+intellectuel)\\s*(?:faible|bas|d[eé]ficient)\\b",
        flags: "iu",
        note: "QI associé à un groupe. « QI » seul doit passer."
      },
      {
        id: "pat-fr-coton-expulsion",
        category: "racism",
        weight: 0.6,
        pattern: "(?:^|[^\\p{L}\\p{N}\\s']|\\n|@\\w+\\s|\\btoi\\s)[^\\S\\n]*(?:retourne|retournez|rentre|rentrez|va|vas|allez)(?:\\b.{0,120}\\bchamps?\\s+de\\s+coton|\\s+(?:ramasser|cueillir)\\s+(?:le|du|ton)\\s+coton)\\b|\\bta\\s+place\\s+est\\s+dans\\s+(?:les|un)\\s+champs?\\s+de\\s+coton\\b",
        flags: "iu",
        note: "Cliché colonial du coton avec un renvoi à l'impératif. « coton » seul et les champs de coton en voyage passent."
      },
      {
        id: "pat-fr-non-blancs-partent",
        category: "racism",
        weight: 0.75,
        pattern: "\\bque\\s+(?:les\\s+)?non[\\s-]?blancs?\\s+(?:partent|d[ée]gagent|rentrent|se\\s+cassent|foutent\\s+le\\s+camp|d[ée]guerpissent|disparaissent)\\b|\\b(?:les\\s+)?non[\\s-]?blancs?\\s+(?:dehors|partez|d[ée]gagez|rentrez)\\b|\\bdehors\\s+(?:les\\s+)?non[\\s-]?blancs?\\b",
        flags: "iu",
        note: "« Que les non-blancs partent », « dehors les non-blancs ». Une étude sur les non-blancs qui partent en vacances passe."
      },
      {
        id: "pat-fr-group-dehors-partent",
        category: "racism",
        weight: 0.7,
        pattern: "(?:\\bles\\s+|(?:^|[^\\p{L}\\p{N}\\s']|\\n|@\\w+\\s|\\btoi\\s)[^\\S\\n]*)(?:arabes?|noirs?|musulmans?|immigr[ée]s?|maghr[ée]bins?|migrants?|[ée]trangers?|africains?)(?:,\\s*|\\s+)(?:dehors|partez|d[ée]gagez)\\b|\\bque\\s+les\\s+(?:arabes|noirs|musulmans|immigr[ée]s|maghr[ée]bins|migrants|[ée]trangers|africains)\\s+(?:partent|d[ée]gagent|rentrent|d[ée]guerpissent|se\\s+cassent|foutent\\s+le\\s+camp)\\b|(?:\\bles\\s+|(?:^|[^\\p{L}\\p{N}\\s']|\\n|@\\w+\\s|\\btoi\\s)[^\\S\\n]*)(?:arabes|noirs|musulmans|immigr[ée]s|maghr[ée]bins|migrants|[ée]trangers|africains)\\s+(?:d[ée]gagent|rentrent)\\s+de\\s+(?:france|chez\\s+nous)\\b",
        flags: "iu",
        note: "« Les arabes dehors », « que les immigrés partent ». Le présent descriptif (pèlerinage, échecs, « les chats noirs dehors ») passe."
      },
      {
        id: "pat-fr-death-celebration",
        category: "threat",
        weight: 0.8,
        pattern: "\\bmort(?:e|s|es)?\\b(?!\\s+de\\s+(?:rire|fatigue|faim|froid|peur|honte|soif|ennui|trouille))[\\s\\S]{0,60}\\b(?:ftg|jouissance|je\\s+jouis)\\b|\\b(?:il|elle|ils|elles)\\s+(?:est|sont)\\s+(?:enfin\\s+)?mort(?:e|s|es)?\\b(?!\\s+de\\s+(?:rire|fatigue|faim|froid|peur|honte|soif|ennui|trouille))[\\s\\S]{0,40}\\b(?:tant\\s+mieux(?!\\s+pour\\s+(?:lui|elle|eux|elles))|bon\\s+d[ée]barras|bien\\s+fait(?!\\s+(?:son|sa|ses|de|d'|le|la|les|un|une|du|des)\\b)|je\\s+(?:suis|me\\s+sens)\\s+(?:trop\\s+|si\\s+|tellement\\s+)?(?:heureux|heureuse|contente?|ravie?)\\b(?!\\s+(?:de|d'|pour|que|qu'|avec)))|\\b(?:heureux|heureuse|contente?|ravie?)s?\\s+(?:qu'(?:il|elle|ils|elles)\\s+(?:soi(?:t|ent)\\s+)?(?:mort(?:e|s|es)?|crev[ée]e?s?)\\b(?!\\s+(?:dans\\s+son\\s+sommeil|paisiblement|sans\\s+souffrir|en\\s+paix|entour[ée]))|de\\s+(?:le|la|les)\\s+(?:voir|savoir)\\s+(?:mort(?:e|s|es)?|crever|mourir)\\b)|\\bquel\\s+plaisir\\s+de\\s+(?:le|la|les|voir|savoir)\\b[\\s\\S]{0,40}\\b(?:crever|mourir|mort(?:e|s|es)?|crev[ée])\\b(?!\\s+de\\s+(?:rire|fatigue|faim|froid|peur|honte|soif|ennui|trouille))",
        flags: "iu",
        note: "Joie qui porte sur la mort de quelqu'un (« il est mort, tant mieux », « heureux qu'il soit mort », « quel plaisir de le voir crever »). Les avis de décès et « mort de rire » passent."
      },
      {
        id: "pat-fr-voyou-attack",
        category: "insult",
        weight: 0.55,
        pattern: "\\b(?:c'?(?:est|[ée]tait)|t'?es|tu\\s+es)\\s+(?:juste\\s+|vraiment\\s+|bien\\s+|rien\\s+)?(?:qu'\\s*)?(?:un|une)\\s+(?:(?:petite?|p'?tite?|vraie?|gros(?:se)?|sale|grande?)\\s+)?voyous?\\b|\\b(?:sales?|esp[eè]ces?\\s+de|bande\\s+de)\\s+voyous?\\b|\\bvoyous?\\s+(?:tout\\s+court|litt[ée]ralement|[ée]videmment)\\b|\\bfin\\s+de\\s+voyou\\b",
        flags: "iu",
        note: "« voyou » seulement en attaque (c'est un voyou, sale voyou). « agressé par un voyou » et « c'est Voyou » passent. Poids faible."
      },
      {
        id: "pat-fr-meme-communaute-dogwhistle",
        category: "racism",
        weight: 0.8,
        pattern: "\\bm[eê]me\\s+communaut[eé]\\b(?!\\s+(?:de\\s+communes|d'agglom[ée]ration|urbaine|europ[ée]enne))[\\s\\S]{0,200}\\b(?:viol(?:s|[ée]e?s?|er|ait|aient|eurs?|euses?)?|kalash\\p{L}{0,8}|kalachnikov\\p{L}{0,2}|terroris(?:tes?|me)|attentats?)\\b|\\b(?:viol(?:s|[ée]e?s?|er|ait|aient|eurs?|euses?)?|kalash\\p{L}{0,8}|kalachnikov\\p{L}{0,2}|terroris(?:tes?|me)|attentats?)\\b[\\s\\S]{0,200}\\bm[eê]me\\s+communaut[eé]\\b(?!\\s+(?:de\\s+communes|d'agglom[ée]ration|urbaine|europ[ée]enne))",
        flags: "iu",
        note: "Sous-entendu « même communauté » + viol, kalash ou terrorisme. Violon, violences et « communauté de communes » passent."
      },
      {
        id: "pat-fr-vermine-person",
        category: "insult",
        weight: 0.7,
        pattern: "\\bsales?\\s+vermines?\\b|\\b(?:cette|ce)\\s+vermine\\b(?!\\s+(?:a\\s+envahi|envahit|dans|sous|ronge|grouille|pullule))|\\bvermines?\\s+de\\s+(?:gauchistes?|droitards?|fachos?|juifs?|arabes?|noirs?|migrants?|musulmans?|merde|gnoules?|bougnoules?|n[eè]gres?|bicots?|youpins?)\\b",
        flags: "iu",
        note: "Personne traitée de vermine. « la vermine a envahi le grenier » passe."
      },
      {
        id: "pat-fr-dechet-person",
        category: "insult",
        weight: 0.7,
        pattern: "\\b(?:sales?|(?<![\\p{L}\\p{N}]\\s+|')esp[eè]ce\\s+de)\\s+d[ée]chets?\\b|\\b(?:t'?es|tu\\s+es|tu\\s+n'es)\\s+(?:rien\\s+)?(?:qu'\\s*)?(?:un\\s+)?(?:(?:gros|sale|petit)\\s+)?d[ée]chet\\b|\\bd[ée]chet\\s+humain\\b",
        flags: "iu",
        note: "Personne traitée de déchet. « zéro déchet » et « ce déchet ne se recycle pas » passent. « un déchet en moins » passe par pat-fr-en-moins-celebration."
      },
      {
        id: "pat-fr-racaille-framed",
        category: "insult",
        weight: 0.55,
        pattern: "\\b(?:c'?(?:est|[ée]tait)\\s+(?:une?\\s+|de\\s+la\\s+)?|une?\\s+|des?\\s+)racailles?\\b",
        flags: "iu",
        note: "Racaille dans une phrase d'attaque. « sale racaille » passe par bl-fr-sale-racaille."
      },
      {
        id: "pat-fr-execution-threat",
        category: "threat",
        weight: 0.85,
        pattern: "(?:\\b(?:doivent|doit|devraient|devrait|faut|faudrait|m[ée]rite(?:nt|raient|rait)?)\\s+(?:tous\\s+|toutes\\s+)?(?:d')?[eê]tre\\s+ex[ée]cut[ée]s?\\b|\\bqu'(?:ils?|elles?)\\s+(?:soient|soit)\\s+ex[ée]cut[ée]e?s?\\b|\\bil\\s+faut\\s+(?:les|l')\\s*ex[ée]cuter\\b(?=\\s*(?:$|[^\\s\\p{L}\\p{N}]|tous\\b|toutes\\b|sans\\s+(?:proc[eè]s|sommation)|sur\\s+place|publiquement|en\\s+place\\s+publique))|\\bex[ée]cutez[\\s-]les\\b(?=\\s*(?:$|[^\\s\\p{L}\\p{N}]|tous\\b|toutes\\b))|\\b(?:sont|est)\\s+[àa]\\s+ex[ée]cuter\\s+(?:sans\\s+(?:proc[eè]s|sommation)|sur\\s+place|imm[ée]diatement)|\\bex[ée]cut(?:er|ez)\\s+(?:tous\\s+)?(?:ces|les|des)\\s+(?:gens|[ée]trangers|immigr[ée]s|migrants|juifs|arabes|noirs|musulmans|tra[îi]tres|gauchistes)\\b)(?<!\\b(?:travaux|tests?|scripts?|programmes?|codes?|fichiers?|calculs?|traitements?|processus|ordres?|contrats?|jugements?|arr[êe]t[ée]s?|d[ée]crets?|mandats?|budgets?|projets?|plans?|morceaux|mouvements?|paiements?|virements?)\\b[^.!?\\n]{0,60})",
        flags: "iu",
        note: "Appel à exécuter des personnes (« doivent être exécutés », « il faut les exécuter », « exécuter les étrangers »). Les consignes techniques (tests, scripts, travaux à exécuter) et « ont été exécutés » dans la presse passent."
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
        id: "bl-fr-abruti",
        category: "insult",
        weight: 0.65,
        pattern: "\\babruti(?:e|s|es)?\\b(?<!\\bj(?:e\\s+|')(?:suis|me\\s+sens|me\\s+trouve)\\s+(?:(?:un|une|qu'une?|rien|le|la|vraiment|tellement|trop|compl[eè]tement|totalement|grave|si|vraie?|gros(?:se)?|petite?|vieux|vieille|pauvre|sales?|sacr[ée]e?|parfois|souvent|toujours|encore|bien|tout|toute)\\s+){0,3}\\p{L}+)(?!\\s+(?:je\\s+(?:suis|fais)|j'(?:ai\\s+[ée]t[ée]|[ée]tais)))",
        flags: "iu",
        note: "Insulte directe. « quel abruti je suis » et « je suis abruti de fatigue » passent. Écrit en motif pour l'autodérision, sous l'id de l'ancien mot."
      },
      {
        id: "bl-fr-tocard",
        category: "insult",
        weight: 0.75,
        pattern: "\\btocard(?:e|s|es)?\\b(?<!\\bj(?:e\\s+|')(?:suis|me\\s+sens|me\\s+trouve)\\s+(?:(?:un|une|qu'une?|rien|le|la|vraiment|tellement|trop|compl[eè]tement|totalement|grave|si|vraie?|gros(?:se)?|petite?|vieux|vieille|pauvre|sales?|sacr[ée]e?|parfois|souvent|toujours|encore|bien|tout|toute)\\s+){0,3}\\p{L}+)(?!\\s+(?:je\\s+(?:suis|fais)|j'(?:ai\\s+[ée]t[ée]|[ée]tais)))",
        flags: "iu",
        note: "Insulte. « je suis un vrai tocard en cuisine » passe. Écrit en motif pour l'autodérision, sous l'id de l'ancien mot."
      },
      {
        id: "bl-fr-cretin",
        category: "insult",
        weight: 0.7,
        pattern: "\\bcr[ée]tin(?:e|s|es)?\\b(?<!\\bj(?:e\\s+|')(?:suis|me\\s+sens|me\\s+trouve)\\s+(?:(?:un|une|qu'une?|rien|le|la|vraiment|tellement|trop|compl[eè]tement|totalement|grave|si|vraie?|gros(?:se)?|petite?|vieux|vieille|pauvre|sales?|sacr[ée]e?|parfois|souvent|toujours|encore|bien|tout|toute)\\s+){0,3}\\p{L}+)(?!\\s+(?:je\\s+(?:suis|fais)|j'(?:ai\\s+[ée]t[ée]|[ée]tais)))",
        flags: "iu",
        note: "Insulte. « quel crétin je suis » passe. Écrit en motif pour l'autodérision, sous l'id de l'ancien mot."
      },
      {
        id: "bl-fr-debile",
        category: "insult",
        weight: 0.65,
        pattern: "\\bd[ée]biles?\\b(?<!\\bj(?:e\\s+|')(?:suis|me\\s+sens|me\\s+trouve)\\s+(?:(?:un|une|qu'une?|rien|le|la|vraiment|tellement|trop|compl[eè]tement|totalement|grave|si|vraie?|gros(?:se)?|petite?|vieux|vieille|pauvre|sales?|sacr[ée]e?|parfois|souvent|toujours|encore|bien|tout|toute)\\s+){0,3}\\p{L}+)(?!\\s+(?:je\\s+(?:suis|fais)|j'(?:ai\\s+[ée]t[ée]|[ée]tais)))",
        flags: "iu",
        note: "Insulte, souvent dans une phrase adressée. « je suis débile, j'ai oublié mes clés » passe. Écrit en motif pour l'autodérision, sous l'id de l'ancien mot."
      },
      {
        id: "pat-fr-directed-con",
        category: "insult",
        weight: 0.6,
        pattern: "\\b(?:t'?es|tu\\s+es|t'?as\\s+l'air|tu\\s+dois\\s+[eê]tre|faut\\s+(?:vraiment\\s+)?[eê]tre)\\s+(?:vraiment\\s+|trop\\s+|tellement\\s+|grave\\s+|compl[eè]tement\\s+)?(?:con|conne|imb[eé]cile|idiote?)\\b|\\bquel(?:le)?\\s+(?:con|conne|connard|connasse|abrutie?|imb[eé]cile|idiote?|d[eé]bile|cr[eé]tine?)\\b(?!\\s+(?:je\\s+(?:suis|fais)|j'(?:ai|[ée]tais)))|\\btoi\\s+(?:le|la)\\s+(?:con|conne|connard|connasse|abrutie?|imb[eé]cile|idiote?|d[eé]bile|cr[eé]tine?)\\b",
        flags: "iu",
        note: "« t'es con », « tu dois être con », « quel imbécile ». Passent : « con » seul, « peut-être idiot », l'espagnol « es con » (c'est avec) et « quel imbécile je suis »."
      },
      {
        id: "pat-fr-petit-con",
        category: "insult",
        weight: 0.7,
        pattern: "(?:(?:\\b(?:un|une|ce|cette|le|la)\\s+(?:(?:p'?tite?|petite?|gros(?:se)?|sale|pauvre|vraie?|vieux|vieille)\\s+)?(?<!\\bfai(?:re|s|t|tes|sons|sais|sait|saient|sant)\\s+(?:\\p{L}+\\s+){0,2}(?:le|la)\\s+)|\\b(?:p'?tite?s?|petite?s?|gros(?:se)?s?|pauvres?|vraie?s?|vieux|vieilles?|esp[eè]ces?\\s+de|bande\\s+de)\\s+(?:sales?\\s+)?|\\b(?:p'?tite?|petite?|gros(?:se)?|sale|pauvre))con(?:ne)?s?\\b|\\bsales?\\s+(?:connes?|cons\\b|con(?=\\s*(?:$|[^\\s\\p{L}\\p{N}])|\\s+(?:va|vas|de\\s+merde|d'|qui|comme|toi|que\\s+(?:tu|t'|vous))\\b)))(?<!\\bj(?:e\\s+|')(?:suis|me\\s+sens|me\\s+trouve)\\s+(?:(?:un|une|qu'une?|rien|le|la|vraiment|tellement|trop|compl[eè]tement|totalement|grave|si|vraie?|gros(?:se)?|petite?|vieux|vieille|pauvre|sales?|sacr[ée]e?|parfois|souvent|toujours|encore|bien|tout|toute)\\s+){0,3}\\p{L}+)(?!\\s+(?:je\\s+(?:suis|fais)|j'(?:ai\\s+[ée]t[ée]|[ée]tais)))",
        flags: "iu",
        note: "« un petit con », « pauvre con », « sale con », collé ou non (« ptitcon »). Jamais « con » seul, ni « faire le con », ni « je suis un vrai con ». En espagnol, « sale con » (sort avec) est toujours suivi d'un complément et passe."
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
        pattern: "\\bputain\\s+d(?:e\\s+|')(?:tocards?|encul[ée]e?s?|enfoir[ée]e?s?|salauds?|salopes?|connards?|connasses?|abruti(?:e|s|es)?|cr[ée]tin(?:e|s|es)?|d[ée]biles?|nazes?|boloss(?:es)?|branleu(?:r|rs|se|ses)|ordures?|pourri(?:e|s|es)?|cassos|imb[ée]ciles?|idiot(?:e|s|es)?|b[âa]tard(?:e|s|es)?|cons?|connes?)\\b",
        flags: "iu",
        note: "« putain de » + insulte. « putain » seul et « putain de merde » passent."
      },
      {
        id: "pat-fr-tes-un-insult",
        category: "insult",
        weight: 0.75,
        pattern: "\\b(?:t'?es|tu\\s+es|t'?as\\s+l'air\\s+d')\\s*(?:vraiment\\s+|juste\\s+|rien\\s+)?(?:qu'\\s*)?(?:un|une)\\s+(?:putain\\s+d(?:e\\s+|'))?(?:tocarde?|encul[ée]e?|enfoir[ée]e?|salaud|salope|connard|connasse|abrutie?|cr[ée]tine?|d[ée]bile|naze|boloss|branleu(?:r|se)|ordure|pourrie?|cassos|merde|imb[ée]cile|idiote?|b[âa]tarde?)\\b",
        flags: "iu",
        note: "« t'es un » + insulte (« t'es qu'une merde », « t'es un idiot »). « t'es un con » passe par pat-fr-petit-con."
      },
      {
        id: "pat-fr-espece-sale-insult",
        category: "insult",
        weight: 0.7,
        pattern: "(?:\\b(?:esp[eè]ces?\\s+(?:de\\s+|d')|sales?\\s+|pauvres?\\s+|gros(?:se)?s?\\s+|vraie?s?\\s+|bande\\s+(?:de\\s+|d'))(?:tocards?|encul[ée]e?s?|enfoir[ée]e?s?|salauds?|salopes?|connards?|connasses?|abruti(?:e|s|es)?|cr[ée]tin(?:e|s|es)?|d[ée]biles?|nazes?|boloss(?:es)?|branleu(?:r|rs|se|ses)|ordures?|pourri(?:e|s|es)?|cassos|imb[ée]ciles?|idiot(?:e|s|es)?|b[âa]tard(?:e|s|es)?)|\\b(?:(?<![\\p{L}\\p{N}]\\s+|')esp[eè]ces?\\s+de|sales?|pauvres?)\\s+merdes?)\\b(?<!\\bj(?:e\\s+|')(?:suis|me\\s+sens|me\\s+trouve)\\s+(?:(?:un|une|qu'une?|rien|le|la|vraiment|tellement|trop|compl[eè]tement|totalement|grave|si|vraie?|gros(?:se)?|petite?|vieux|vieille|pauvre|sales?|sacr[ée]e?|parfois|souvent|toujours|encore|bien|tout|toute)\\s+){0,3}\\p{L}+)(?!\\s+(?:je\\s+(?:suis|fais)|j'(?:ai\\s+[ée]t[ée]|[ée]tais)))",
        flags: "iu",
        note: "« espèce de », « sale », « pauvre » ou « bande de » + insulte (« espèce de merde », « bande de pourris »). « c'est de la vraie merde » sur un objet et « je suis un vrai tocard » passent."
      },
      {
        id: "pat-fr-enfoires",
        category: "insult",
        weight: 0.8,
        pattern: "\\b(?:ces|quels|(?:vous\\s+[êe]tes|tous|que|rien\\s+que)\\s+des)\\s+enfoir[ée]s\\b",
        flags: "iu",
        note: "« enfoirés » au pluriel dans une attaque (« vous êtes des enfoirés »). « Les Enfoirés », le spectacle, passe."
      },
      {
        id: "pat-fr-tes-insult-adj",
        category: "insult",
        weight: 0.65,
        pattern: "\\b(?:t'?es|tu\\s+es)\\s+(?:vraiment\\s+|trop\\s+|tellement\\s+|grave\\s+|compl[eè]tement\\s+)?(?:tocarde?|encul[ée]e?|enfoir[ée]e?|salaud|salope|connard|connasse|abrutie?|cr[ée]tine?|d[ée]bile|boloss|branleu(?:r|se)|pourrie?|cassos|lamentable|path[ée]tique|minable|pitoyable|ridicule|immonde|ignoble)\\b",
        flags: "iu",
        note: "« t'es pourri », « t'es lamentable », « t'es pathétique » sans « un ». Au singulier seulement : « sors tes ordures » passe."
      },
      {
        id: "pat-fr-pourri-person",
        category: "insult",
        weight: 0.6,
        pattern: "(?:\\b(?:c'?(?:est|[ée]tait)|est|[ée]tait|sont|c'?[ée]taient)\\s+(?:vraiment\\s+|juste\\s+|bien\\s+|rien\\s+)?(?:qu'\\s*)?(?:un|une|des)\\s+(?:(?:vraie?s?|gros(?:se)?s?|sales?|sacr[ée]e?s?)\\s+)?(?:nazes?|pourri(?:e|s|es)?|ordures?)|\\b(?:ces|que\\s+des|tous\\s+des)\\s+(?:nazes|pourri(?:e)?s|ordures)|\\b(?:gouvernement|ramassis|clique|nid)\\s+de\\s+(?:nazes|pourris|ordures))\\b(?!\\s+(?:m[ée]nag|g[âa]t[ée]))",
        flags: "iu",
        note: "« naze », « pourri » ou « ordure » employés comme noms (« c'est une ordure », « ces pourris »). « le système est pourri », « un pourri gâté » et « les ordures ménagères » passent."
      },
      {
        id: "pat-fr-en-moins-celebration",
        category: "threat",
        weight: 0.85,
        pattern: "\\b(?:d[ée]linquante?s?|d[ée]chets?|racailles?|voyous?|vermines?|ordures?|mort(?:e|s|es)?|assassine?s?|criminel(?:le)?s?)\\b.{0,80}\\b(?:un|une)\\s+en\\s+moins\\b(?!\\s+(?:que|qu'))|\\b(?:un|une)\\s+en\\s+moins\\b(?!\\s+(?:que|qu')).{0,80}\\b(?:dommage|bien\\s+fait|bravo|tant\\s+mieux)\\b|\\b(?:un|une)\\s+(?:d[ée]chet|d[ée]linquante?|racaille|voyou|vermine|ordure|merde)\\s+en\\s+moins\\b",
        flags: "iu",
        note: "« un en moins » pour se réjouir d'une mort. « un examen de passé, un en moins » passe."
      },
      {
        id: "pat-fr-possessive-de-merde",
        category: "insult",
        weight: 0.75,
        pattern: "\\b(?:ton|ta|tes|son|sa|ses|votre|vos)\\s+(?:t[êe]tes?|gueules?|tronches?|faces?|races?|m[èe]res?|p[èe]res?|fr[èe]res?|s(?:œ|oe)urs?|cousine?s?|potes?|copains?|copines?|mecs?|meufs?|femmes?|maris?|fils|filles?|familles?|gosses?|parents|enfants?|darons?|daronnes?)\\s+de\\s+merde\\b",
        flags: "iu",
        note: "« ta tête de merde », « ton pote de merde ». Les objets (« ton téléphone de merde ») et « ma vie de merde » passent."
      },
      {
        id: "pat-fr-est-un-delinquant",
        category: "insult",
        weight: 0.6,
        pattern: "\\b(?:c'?(?:est|[ée]tait)|t'?es|tu\\s+es)\\s+(?:bien\\s+|juste\\s+|vraiment\\s+|rien\\s+)?(?:qu'\\s*)?(?:un|une)\\s+(?:(?:sale|petite?|vraie?|gros(?:se)?)\\s+)?d[ée]linquante?\\b",
        flags: "iu",
        note: "« c'est un délinquant », « t'es qu'un délinquant » en attaque. « le suspect est un délinquant » dans la presse passe."
      },
      {
        id: "pat-fr-merde-de-person",
        category: "insult",
        weight: 0.75,
        pattern: "\\b(?:cette|une|la|ce|cet)\\s+merde\\s+de\\s+(?:mecs?|types?|gars|meufs?|nanas?|gamine?s?|gosses?|journalistes?|pr[ée]fets?|d[ée]put[ée]e?s?|ministres?|pr[ée]sidente?s?|maires?|flics?|keufs?|profs?|arbitres?|juges?|patrons?|chefs?|voisine?s?|fachos?|gauchistes?|politicien(?:ne)?s?|militante?s?|influenceu(?:r|rs|se|ses)|joueu(?:r|rs|se|ses)|coachs?|entra[îi]neu(?:r|rs|se|ses))\\b",
        flags: "iu",
        note: "« cette merde de préfet ». « cette merde de météo » et « une merde de chien » passent."
      },
      {
        id: "pat-fr-parle-dune-merde",
        category: "insult",
        weight: 0.55,
        pattern: "\\b(?:quelle?|c'est\\s+une)\\s+merde\\s+(?:ce|cette|ces)\\s+(?:mecs?|types?|gars|meufs?|nanas?|gamine?s?|gosses?|journalistes?|pr[ée]fets?|d[ée]put[ée]e?s?|ministres?|pr[ée]sidente?s?|maires?|flics?|keufs?|profs?|arbitres?|juges?|patrons?|chefs?|voisine?s?|fachos?|gauchistes?|politicien(?:ne)?s?|militante?s?|influenceu(?:r|rs|se|ses)|joueu(?:r|rs|se|ses)|coachs?|entra[îi]neu(?:r|rs|se|ses))\\b|\\b(?:ce|cette)\\s+(?:mecs?|types?|gars|meufs?|nanas?|gamine?s?|gosses?|journalistes?|pr[ée]fets?|d[ée]put[ée]e?s?|ministres?|pr[ée]sidente?s?|maires?|flics?|keufs?|profs?|arbitres?|juges?|patrons?|chefs?|voisine?s?|fachos?|gauchistes?|politicien(?:ne)?s?|militante?s?|influenceu(?:r|rs|se|ses)|joueu(?:r|rs|se|ses)|coachs?|entra[îi]neu(?:r|rs|se|ses))\\s+(?:c'est|est)\\s+une\\s+(?:vraie\\s+|grosse\\s+|petite\\s+|sacr[ée]e\\s+)?merde\\b|\\bune\\s+merde\\s+humaine\\b",
        flags: "iu",
        note: "Personne traitée de merde (« ce mec c'est une merde », « quelle merde ce type »). « quelle merde, j'ai raté le bus » et « ce film c'est une merde » passent."
      },
      {
        id: "pat-fr-retourne-ton-pays",
        category: "racism",
        weight: 0.7,
        pattern: "\\b(?:rest(?:er|e|ez)|retourn(?:er|e|es|ez)|rentr(?:er|e|es|ez)|repart(?:ir|ez|s))\\s+(?:pas\\s+)?(?:dans|chez|au|en)\\s+(?:ton|ta|votre|vos)\\s+(?:pays|bleds?|afrique|maghreb|alg[ée]rie|maroc|tunisie)\\b|\\bqu'(?:ils|elles|à)\\s+(?:rest(?:er|ent)|retourn(?:er|ent)|rentr(?:er|ent)|repart(?:ir|ent))\\s+(?:dans|chez|au|en)\\s+leurs?\\s+(?:pays|bleds?|afrique|maghreb|alg[ée]rie|maroc|tunisie)\\b",
        flags: "iu",
        note: "« retourne dans ton pays », « qu'ils retournent dans leur pays ». « les réfugiés espèrent rentrer dans leur pays » passe."
      },
      {
        id: "pat-fr-essentialism",
        category: "racism",
        weight: 0.65,
        pattern: "\\b(?:sauvagerie|barbarie|violence|b[êe]tise|d[ée]linquance)\\s+(?:propre|typique|inh[ée]rente?|naturelle)s?\\s+(?:(?:aux|des)\\s+(?:arabes|africains|noirs|musulmans|maghr[ée]bins|immigr[ée]s|n[èe]gres|[ée]trangers|migrants|roms|gitans|juifs)|[àa]\\s+(?:la|leur|cette)\\s+race)\\b",
        flags: "iu",
        note: "Sauvagerie attribuée à une origine. « la bêtise typique des réseaux sociaux » passe."
      },
      {
        id: "pat-fr-qi-faible",
        category: "racism",
        weight: 0.55,
        pattern: "\\b(?:vos|leurs?|ton|votre)\\s+qis?\\s+(?:sont|est)\\s+[^.!?]{0,30}\\b(?:faibles?|bas|catastrophiques?)\\b",
        flags: "iu",
        note: "QI faible adressé à quelqu'un. « QI » seul passe."
      },
      {
        id: "pat-fr-insultes-fortes",
        category: "insult",
        weight: 0.5,
        pattern: "(?<![\\p{L}\\p{N}])(?:(?<![(+\\-]\\s?|\\bhors\\s|\\b(?:die|der|den|dem|und|oder|ist|sind|hat|haben|will|wird|werden|nicht|mit|von|f[üu]r|auf|gegen|zur|zum|im|vom|bei|w[äa]hl\\p{L}*|the|of|party|allemand\\p{L}*|german)\\b[^.!?\\n]{0,30})fdps?(?![\\p{L}\\p{N})\\-])(?![^.!?\\n]{0,30}\\b(?:die|der|den|dem|und|oder|ist|sind|hat|haben|will|wird|werden|nicht|mit|von|f[üu]r|auf|gegen|zur|zum|im|vom|bei|w[äa]hl\\p{L}*|the|of|party|allemand\\p{L}*|german)\\b)(?!\\s*(?:offerts?|gratuits?|inclus|compris|[àa]\\s+partir|d[èe]s\\b|:|\\+|\\d|€))|(?<!\\b(?:supr[êe]me|groupe|de|du|[ée]cout\\p{L}*)\\s)ntm(?!\\s+en\\s+concert)|fils\\s+de\\s+(?:pute|chienne)|nique\\s+(?:ta|sa|vos|votre)\\s+m[èe]re|va\\s+te\\s+faire\\s+(?:foutre|enculer)|ferme\\s+ta\\s+gueule|fermez\\s+vos\\s+gueules)(?![\\p{L}\\p{N}])",
        flags: "iu",
        note: "Insultes fortes (fdp, ntm, va te faire foutre, ferme ta gueule). Passent : « FDP offerts », le parti allemand (« die FDP », « le FDP allemand ») et le groupe NTM."
      },
      {
        id: "pat-fr-sale-x",
        category: "insult",
        weight: 0.55,
        pattern: "(?<![\\p{L}])sales?\\s+(?:gauchistes?|fachos?|chiens?|rats?|tra[îi]tres?|colons?|wokes?)(?![\\p{L}])",
        flags: "iu",
        note: "« sale » + étiquette (gauchiste, facho…)."
      },
      {
        id: "pat-fr-deshumanisation",
        category: "insult",
        weight: 0.65,
        pattern: "(?<![\\p{L}])(?:vous\\s+[êe]tes|t'es|tu\\s+es|(?<![\\p{L}\\p{N}]\\s+|')esp[èe]ces?\\s+d(?:e|')|(?<![\\p{L}\\p{N}]\\s+|')bande\\s+d(?:e|'))\\s*(?:des\\s+|une?\\s+|de\\s+la\\s+|petites?\\s+)?(?:vermines?|cafards?|parasites?|rats|sous[\\s-]hommes?|sous[\\s-]races?|ordures|d[ée]chets|merdes(?:\\s+pleureuses)?|animaux|singes|sauvages?|chiens?|porcs?|crapules?|raclures?)(?![\\p{L}])|(?<![\\p{L}])(?:ce\\s+sont|c'est|ces|tous\\s+ces|que\\s+des)\\s+(?:des\\s+|une?\\s+|de\\s+la\\s+)?(?:vermines?|sous[\\s-]hommes?|sous[\\s-]races?|raclures?|merdes\\s+pleureuses|crapules?|sauvages)(?![\\p{L}])|(?<![\\p{L}])(?:ce\\s+sont\\s+des|ces|tous\\s+ces|que\\s+des)\\s+(?:cafards|parasites|rats|porcs|chiens|animaux|singes|vermines?)\\s+(?:qui\\s+)?(?:(?:nous\\s+)?envahissent\\s+(?:notre\\s+pays|la\\s+france|l'europe|le\\s+pays|chez\\s+nous)|vivent\\s+(?:des\\s+(?:allocs|aides)|aux\\s+crochets)|profitent\\s+de\\s+nos\\s+(?:aides|allocs|imp[ôo]ts)|(?:doivent|devraient)\\s+[êe]tre\\s+expuls[ée]s|retournez|rentrez)",
        flags: "iu",
        note: "« vous êtes des » + vermine, cafards, animaux ; « ce sont des sauvages » ; « ces cafards envahissent notre pays ». Les animaux au sens propre (« 260 espèces de singes », « ces chiens sont adorables ») passent."
      },
      {
        id: "pat-fr-petite-merde",
        category: "insult",
        weight: 0.5,
        pattern: "(?<![\\p{L}])petites?\\s+(?:merdes?|raclures?|baltringues?)(?![\\p{L}])",
        flags: "iu",
        note: "« petite merde ». « mes petites crapules » (des enfants) passe."
      },
      {
        id: "pat-fr-faut-les-tuer",
        category: "threat",
        weight: 0.8,
        pattern: "\\b(?:faut|faudrait|on\\s+devrait|qu'on)\\s+(?:les|tous\\s+les|le|la)\\s+(?:tuer|buter|fusiller|gazer|exterminer|pendre|tabasser|massacrer|[ée]gorger|lyncher)\\b|\\b(?:ces|les)\\s+(?:arabes|noirs|juifs|juives|musulmans|musulmanes|immigr[ée]s|[ée]trangers|migrants|tra[iî]tres|gauchistes|roms|gitans|homos|p[ée]d[ée]s|bougnoules|n[eè]gres|feujs|rebeus|renois)\\b[^.!?]{0,40}\\b(?:faut|faudrait|on\\s+devrait|qu'on)\\s+(?:les|tous\\s+les)\\s+(?:abattre|cramer|br[ûu]ler|noyer)\\b|\\b(?:faut|faudrait|on\\s+devrait|qu'on)\\s+(?:les|tous\\s+les)\\s+(?:abattre|cramer|br[ûu]ler|noyer)\\b[^.!?]{0,40}\\b(?:ces|les)\\s+(?:arabes|noirs|juifs|juives|musulmans|musulmanes|immigr[ée]s|[ée]trangers|migrants|tra[iî]tres|gauchistes|roms|gitans|homos|p[ée]d[ée]s|bougnoules|n[eè]gres|feujs|rebeus|renois)\\b",
        flags: "iu",
        note: "Appel au meurtre (« il faut les tuer »). Abattre, cramer, brûler ou noyer ne comptent qu'à côté d'un groupe visé : « ces arbres, il faut les abattre » passe."
      },
      {
        id: "pat-fr-groupe-meurtre",
        category: "threat",
        weight: 0.85,
        pattern: "\\bmort\\s+aux\\s+(?:juifs|juives|arabes|noirs|musulmans|musulmanes|immigr[ée]s|migrants|[ée]trangers|blancs|roms|gitans|homos|p[ée]d[ée]s|africains|maghr[ée]bins|chinois|asiatiques|bougnoules|n[eè]gres|feujs|rebeus|renois|chr[ée]tiens|cathos)\\b|\\b(?:faut|faudrait|on\\s+devrait|qu'on)\\s+(?:tous\\s+)?(?:tuer|buter|gazer|exterminer|fusiller|pendre|massacrer|abattre|cramer|br[ûu]ler|noyer|[ée]gorger|lyncher)\\s+(?:tous\\s+)?(?:les|ces)\\s+(?:juifs|juives|arabes|noirs|musulmans|musulmanes|immigr[ée]s|migrants|[ée]trangers|blancs|roms|gitans|homos|p[ée]d[ée]s|africains|maghr[ée]bins|chinois|asiatiques|bougnoules|n[eè]gres|feujs|rebeus|renois|chr[ée]tiens|cathos)\\b|(?<!\\b(?:contre|sur|envers|pour|de|des|aux|pas|que|non|dire)\\s+(?:tous\\s+)?(?:les\\s+)?)\\b(?:les\\s+)?(?:juifs|juives|arabes|noirs|musulmans|musulmanes|immigr[ée]s|migrants|[ée]trangers|blancs|roms|gitans|homos|p[ée]d[ée]s|africains|maghr[ée]bins|chinois|asiatiques|bougnoules|n[eè]gres|feujs|rebeus|renois|chr[ée]tiens|cathos)\\s+(?:doivent|devraient|m[ée]ritent\\s+de)\\s+(?:tous\\s+)?(?:mourir|crever|[êe]tre\\s+(?:tu[ée]s|gaz[ée]s|extermin[ée]s|pendus|fusill[ée]s|massacr[ée]s|br[ûu]l[ée]s|abattus))\\b|\\b(?:fusiller|fusillez|exterminer|exterminez|gazer|gazez|pendre(?!\\s+la\\s+cr[ée]maill[eè]re)|pendez|pendaison)\\b[^.!?]{0,40}\\b(?:tous\\s+)?ces\\s+gens\\b",
        flags: "iu",
        note: "Appel au meurtre d'un groupe (« mort aux juifs », « il faut gazer les X », « les X doivent mourir »). « les insultes contre les juifs doivent… » et « mort aux rats » passent."
      },
      {
        id: "pat-fr-sale-origine",
        category: "racism",
        weight: 0.8,
        pattern: "(?<![\\p{L}])sales?\\s+(?:bicots?|ritals?|ritales?|n[èe]gres?|blacks?|renois|rebeus?|beurs?|immigr[ée]s?|migrants?|chinois|chinetoques?|noich|roms?|gitans?|ratons?(?!\\s+laveurs?))(?![\\p{L}])|(?<![\\p{L}])(?:esp[èe]ces?\\s+de\\s+|putain\\s+de\\s+|bande\\s+de\\s+|ta\\s+gueule(?:\\s*[,!]+)?\\s+(?:le\\s+|sale\\s+)?)(?:n[èe]gres?|ratons?(?!\\s+laveurs?))(?![\\p{L}])|(?<![\\p{L}])(?:n[èe]gres?|rebeus?|renois|beurs?|ratons?|immigr[ée]s?|migrants?)\\s+de\\s+merde(?![\\p{L}])|(?:\\b(?:un|une|ce|cette|les|ces|des|sales?|esp[èe]ces?\\s+de|bande\\s+de)\\s+|(?:^|[^\\p{L}\\p{N}\\s']|\\n|@\\w+\\s|\\btoi\\s)[^\\S\\n]*)(?:arabes?|noire?s?|chinois(?:es?)?|africaine?s?|maghr[ée]bine?s?|[ée]trang[eè]re?s?|roms?|gitane?s?)\\s+de\\s+merde\\b",
        flags: "iu",
        note: "Insulte bâtie sur l'origine : « sale » + origine, « espèce de nègre », « nègre de merde ». « Le Nègre » cité dans un titre et « mon pull noir de merde » passent."
      },
      {
        id: "pat-fr-sale-religion",
        category: "hate",
        weight: 0.8,
        pattern: "(?<![\\p{L}])sales?\\s+(?:juifs?|juives?|feujs?|musulman(?:e|s|es)?|islamo\\p{L}*|cathos?|chr[ée]tiens?)(?![\\p{L}])|(?<![\\p{L}])(?:juifs?|juives?|feujs?|musulman(?:e|s|es)?|cathos?|chr[ée]tien(?:ne)?s?)\\s+de\\s+merde(?![\\p{L}])",
        flags: "iu",
        note: "« sale » + religion, religion + « de merde »."
      },
      {
        id: "pat-fr-threat",
        category: "threat",
        weight: 0.8,
        pattern: "\\b(?:je\\s+vais\\s+te\\s+(?:tuer|buter|crever|planter(?!\\s+l[àa])|[ée]gorger|d[ée]foncer\\s+(?:la\\s+(?:gueule|t[eê]te|tronche)|ta\\s+(?:race|gueule)))|on\\s+va\\s+te\\s+(?:tuer|buter|crever|planter(?!\\s+l[àa])|[ée]gorger)|(?:je\\s+vais|on\\s+va)\\s+te\\s+retrouver\\b[^.!?]{0,60}\\bte\\s+(?:tuer|buter|crever|d[ée]foncer|planter|[ée]gorger|saigner)|je\\s+sais\\s+o[uù]\\s+tu\\s+(?:habites|vis|cr[eè]ches|bosses|travailles)[^.!?]{0,40}\\b(?:je\\s+vais|on\\s+va)\\s+te\\s+retrouver|va\\s+te\\s+(?:pendre|faire\\s+tuer)|j'esp[eè]re\\s+que\\s+tu\\s+(?:vas\\s+)?(?:cr[eè]ver|cr[eè]ves|mourir|meures|mourras)|tu\\s+m[ée]rites\\s+de\\s+(?:mourir|cr[eè]ver)|suicide[\\s-]toi|tue[\\s-]toi)\\b|(?:^|[.!?,;:\\n])[^\\S\\n]*va\\s+(?:crever|mourir)\\b",
        flags: "iu",
        note: "Menaces adressées. « je vais te retrouver à la gare », « je vais te défoncer à FIFA » et « il va mourir » (presse) passent."
      },
      {
        id: "pat-fr-sexism",
        category: "hate",
        weight: 0.65,
        pattern: "\\b(?:retourne\\s+(?:[àa]|dans)\\s+(?:la|ta)\\s+cuisine|ta\\s+place\\s+est\\s+(?:[àa]|dans)\\s+la\\s+cuisine)\\b|(?<![\\p{L}])(?:sales?|grosses?|esp[eè]ces?\\s+de)\\s+(?:putes?|chiennes?)(?![\\p{L}])",
        flags: "iu",
        note: "Sexisme. « va dans la cuisine chercher le sel » passe. « sale salope » passe par pat-fr-espece-sale-insult."
      },
      {
        id: "pat-fr-ableist",
        category: "hate",
        weight: 0.6,
        pattern: "(?<!\\b(?:si|quand|lorsque)\\s+)\\b(?:t'?es|tu\\s+es)\\s+(?:une?\\s+)?(?:attard[ée]e?|trisomiques?|autistes?|mongol(?:e|s|es)?|handicap[ée]e?)\\b|\\b(?:esp[eè]ces?\\s+(?:de\\s+|d')|sales?\\s+)(?:attard[ée]e?s?|trisomiques?|autistes?|mongol(?:e|s|es)?|handicap[ée]e?s?)\\b|\\b(?:ce|ces|bande\\s+de|pauvres?|gros(?:se)?)\\s+mongoles?\\b",
        flags: "iu",
        note: "Handicap utilisé comme insulte. Le mot seul (« autiste », « la tache mongole »), « si tu es handicapé » et le peuple mongol passent."
      },
      {
        id: "pat-fr-nique",
        category: "profanity",
        weight: 0.5,
        pattern: "(?<!\\bpique[\\s\\p{Pd}_]{0,3})\\bniquer?\\b",
        flags: "iu",
        note: "Juron « nique », masqué seulement si le filtre vulgarité est activé. « pique-nique » passe."
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
        terms: ["negraccio", "negracci", "bingo bongo", "vu cumprà", "vu cumpra", "vu' cumprà", "vu' cumpra"],
        note: "Insultes racistes. « vu cumprà » aussi sans accent ou avec l'apostrophe."
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
        terms: [
          "cazzo",
          "cazzi",
          "coglioni",
          "minchia",
          "porca puttana",
          "porco dio",
          "porca madonna",
          "porca miseria"
        ],
        note: "Jurons, masqués seulement si le filtre vulgarité est activé."
      }
    ],
    patterns: [
      {
        id: "pat-it-go-home",
        category: "racism",
        weight: 0.75,
        pattern: "(?<!\\b(?:quando|se)\\s)\\b(?:torna|tornate|tornatene|tornatevene|vattene|andatevene)\\s+(?:al|nel|a|in)\\s+(?:tuo|vostro)\\s+paese\\b|\\b(?:tornatene|tornatevene|vattene|andatevene)\\s+in\\s+africa\\b|(?:^|\\n|[^\\w\\s]|@\\w+)[^\\S\\n]*(?:torna|tornate)\\s+in\\s+africa\\b|\\brimandateli\\s+(?:a\\s+casa|al\\s+loro\\s+paese|in\\s+africa)\\b",
        flags: "iu",
        note: "« tornatene al tuo paese », « vattene in Africa ». « torna in Africa » ne compte qu'en début de phrase : « il leone torna in Africa » passe, comme « quando tornate al vostro paese? »."
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
        pattern: "(?<![\\p{L}\\p{N}_])(?:sporc(?:[oai]|h[ie])\\s+(?:negr[oaie]|zingar[oaie]|marocchin[oaie]|terron[eia]))(?![\\p{L}\\p{N}_])",
        flags: "iu",
        note: "« sporco » + origine."
      },
      {
        id: "pat-it-monkey",
        category: "racism",
        weight: 0.75,
        pattern: "\\bsei\\s+(?:una\\s+|uno\\s+|proprio\\s+una\\s+)?scimmia\\b|\\b(?:voi|siete)\\s+(?:(?:solo\\s+)?delle\\s+)?scimmie\\b|(?:^|\\n|[^\\w\\s]|@\\w+)[^\\S\\n]*torna(?:te)?\\s+sugli\\s+alberi\\b",
        flags: "iu",
        note: "Singe adressé à quelqu'un. Le singe du zoo, « le grandi scimmie africane » et « il koala torna sugli alberi » passent."
      },
      {
        id: "pat-it-religion",
        category: "hate",
        weight: 0.8,
        pattern: "(?<![\\p{L}\\p{N}_])(?:(?:ebre[oaie]|musulman[oaie]|islamic(?:[oai]|he))\\s+di\\s+merda|sporc(?:[oai]|h[ie])\\s+ebre[oaie])(?![\\p{L}\\p{N}_])",
        flags: "iu",
        note: "Haine religieuse, au masculin comme au féminin."
      },
      {
        id: "pat-it-sexism",
        category: "hate",
        weight: 0.6,
        pattern: "(?:^|\\n|[^\\w\\s]|@\\w+)[^\\S\\n]*torna\\s+in\\s+cucina\\b|\\b(?:zitta\\s+e\\s+torna|tornatene|dovresti\\s+tornare)\\s+in\\s+cucina\\b|\\b(?:brutta|sporca|lurida)\\s+(?:troia|puttana|zoccola)\\b",
        flags: "iu",
        note: "Sexisme. « torna in cucina » ne compte qu'en début de phrase ou après « zitta e » : « lo chef torna in cucina » et « tornare in cucina » passent."
      },
      {
        id: "pat-it-ableist",
        category: "hate",
        weight: 0.6,
        pattern: "(?<!\\b(?:se|quando)\\s)\\bsei\\s+(?:un\\s+|una\\s+)?(?:ritardat[oa]|mongoloide|handicappat[oa]|down(?!\\s+(?:oggi|stasera|ultimamente)\\b))\\b",
        flags: "iu",
        note: "Handicap utilisé comme insulte. « il treno è in ritardo », « se sei handicappato » et « sei down oggi? » passent."
      },
      {
        id: "pat-it-threat",
        category: "threat",
        weight: 0.8,
        pattern: "\\b(?:ti\\s+(?:ammazzo|uccido)(?!\\s+di\\s+(?:baci|coccole|solletico))|ti\\s+spacco\\s+la\\s+faccia|(?:vai|va['’]?)\\s+ad?\\s+(?:ammazzarti(?!\\s+di\\s+(?:lavoro|fatica))|impiccarti)|(?:vanno|andrebbero)\\s+(?:ammazzati|impiccati|bruciati\\s+vivi))\\b|\\bspero\\s+che\\s+(?:tu\\s+)?(?:muoia|crepi)\\b(?!\\s+(?:(?:dal|dalle|dalla|di)\\s+|(?:dall|d)['’])(?:ridere|risate|invidia|noia|gelosia|vergogna)\\b)|(?:^|\\n|[^\\w\\s]|@\\w+|\\b(?:ma|dai|vai)\\s)[^\\S\\n]*ammazzati(?=[^\\S\\n]*(?:$|\\n|[^\\w\\s]|che\\b))|(?<!\\b(?:non|tutti)\\s)\\bdevono\\s+morire\\b(?!\\s+(?:per\\s+(?:forza|\\p{L}+[aei]re?)|prima)\\b)(?![^.!?\\n]{0,80}\\?)",
        flags: "iu",
        note: "Menaces. « ti vengo a prendere », « ti ammazzo di baci », « spero che tu muoia dal ridere », « non devono morire », « devono morire per forza », les questions et les faits divers (« due uomini ammazzati ») passent."
      },
      {
        id: "pat-it-directed-insult",
        category: "insult",
        weight: 0.6,
        pattern: "(?<!\\bnon\\s)\\bsei\\s+(?:un|una|proprio\\s+un|proprio\\s+una)\\s+(?:idiota|cretin[oa]|deficiente|fallit[oa]|pagliaccio|buffone)\\b",
        flags: "iu",
        note: "Insulte adressée. « non sei un fallito » passe."
      },
      {
        id: "pat-it-coglioni",
        category: "insult",
        weight: 0.7,
        pattern: "(?<!\\b(?:i|ai|dai|sui|coi|nei|che)\\s)\\bcoglioni\\b",
        flags: "iu",
        note: "« coglioni » visant des personnes. « rompere i coglioni », « mi stai sui coglioni » et « che coglioni » sont des jurons, comptés avec la vulgarité."
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
        terms: ["y a bon banania", "y'a bon banania", "ya bon banania", "yabon banania"],
        note: "Slogan colonial « y a bon Banania ». La marque Banania seule passe."
      },
      {
        id: "bl-any-singe-savant",
        category: "racism",
        weight: 0.55,
        terms: ["singe savant", "singes savants"],
        requireAttackCompanion: true,
        note: "Cliché colonial. Ne compte qu'avec un autre signal d'attaque : « je ne suis pas ton singe savant » doit passer."
      },
      {
        id: "bl-any-lgbt",
        category: "hate",
        weight: 0.8,
        terms: [
          "pédé",
          "pédés",
          "péde",
          "pédes",
          "pedé",
          "pedés",
          "tarlouze",
          "tarlouzes",
          "fiotte",
          "fiottes",
          "faggot",
          "faggots",
          "schwuchtel",
          "schwuchteln"
        ],
        note: "Insultes homophobes (FR, EN, DE). « fag » est exclu : c'est aussi une cigarette au Royaume-Uni."
      }
    ],
    patterns: [
      {
        id: "pat-any-hang-tree",
        category: "threat",
        weight: 0.85,
        pattern: "\\blynch(?<!(?:tr(?:y|ies|ied|ying)|attempt(?:s|ed|ing)?|threaten(?:s|ed|ing)?)\\s+to\\s+lynch)\\s+(?:him|her|them|'?em)\\b|\\bhang\\s+(?:(?:him|her)\\s+(?:high\\s+)?from\\s+(?:a|the\\s+nearest)|(?:them|'?em|all\\s+of\\s+them)(?:\\s+all)?\\s+(?:high\\s+)?from\\s+the\\s+nearest)\\s+(?:tree|lamp[\\s-]*post)s?\\b|\\b(?:(?:les|le|la|te|vous)\\s+pendre|pend(?:ez|ons|s)[-\\s](?:les|le|la))(?:\\s+tous)?\\s+(?:[àa]\\s+(?:un|cet|l')\\s*arbre|aux\\s+arbres|au\\s+premier\\s+(?:arbre|lampadaire)|[àa]\\s+un\\s+lampadaire|aux\\s+lampadaires|[àa]\\s+la\\s+potence)\\b",
        flags: "iu",
        note: "Appel au lynchage : « lynch them », « hang him from a tree », « pendez-les aux arbres ». Les décorations du sapin, la crémaillère et le récit d'un lynchage (« tried to lynch him ») passent."
      },
      {
        id: "pat-homophobe",
        category: "hate",
        weight: 0.8,
        pattern: "(?<![\\p{L}])(?:tapettes?(?!\\s+(?:(?:[àa]|pour|anti)[\\s-]*(?:mouches?|moustiques?|souris|rats?|tapis)|[ée]lectriques?))|(?:un|des|les|ce|ces|sales?|gros|esp[eè]ces?\\s+de|bande\\s+de|t'es)\\s+pedes?|(?:sales?|gros|esp[eè]ces?\\s+de|bande\\s+de|encul[ée]s?\\s+de|t'es(?:\\s+(?:qu'\\s*)?un)?|tu\\s+es(?:\\s+un)?|c'est\\s+(?:qu'\\s*)?un)\\s+pds?)(?![\\p{L}])",
        flags: "iu",
        note: "Insultes homophobes qui ont un autre sens seules. La tapette à mouches passe. « pede » sans accent ne compte qu'après un déterminant, « sale » ou « t'es », et « PD » qu'après « sale », « t'es », « c'est un »… : « ela pede » (portugais) et le PD italien passent."
      },
      {
        id: "pat-homophobe-end",
        category: "hate",
        weight: 0.6,
        pattern: "(?<!\\b(?:moi|me|fiers?|fières?|proud)),\\s*homo\\s*[.!?]*\\s*$",
        flags: "iu",
        wholeMessage: true,
        note: "« homo » lancé en fin de message (« ta gueule, homo »). Dit de soi (« Moi, homo », « Fier, homo ! »), il passe. Ne joue pas sur un nom d'affichage (« Marc, homo »)."
      },
      {
        id: "emo-ape-only",
        category: "racism",
        weight: 0.55,
        pattern: "^(?=[^]*(?:🐒|🦍|🐵|🦧))(?:@\\w+\\s*)*(?:[^\\p{L}\\p{N}]|(?<![\\p{L}])(?:mdr|ptdr|lol|lmao|xd|a?ha(?:ha)+h?|a?h(?:ah)+)(?![\\p{L}]))*$",
        flags: "iu",
        wholeMessage: true,
        note: "Réponse faite seulement d'emojis singe (avec emojis, @mentions ou mdr). 🙈🙉🙊 ne comptent pas. Ne joue pas sur un nom d'affichage (« 🐒 »). Écrit en un seul passage pour rester rapide sur un texte long."
      },
      {
        id: "emo-ape-directed",
        category: "racism",
        weight: 0.55,
        pattern: "(?<![\\p{L}])(?:t'es|tu\\s+es|t'?[ée]tais|tu\\s+ressembles?|c'est\\s+toi|comme\\s+toi|toi\\s+le|(?<!(?:\\b(?:les|des|nouvelles?)\\s|[ld]'|\\d\\s))esp[èe]ces?\\s+d['e]|bande\\s+d['e](?!\\s*\\p{L}+\\s+(?:a|ont|est|sont|vit|vivent|s'est|se\\s+sont)(?![\\p{L}]))|ta\\s+race|(?<!je\\s)(?<!on\\s)(?:retourne\\s+(?:dans|en|chez|au)|rentre\\s+chez)|(?<!\\b(?:ça|ca)\\s)d[ée]gage(?!\\s+(?:tellement|trop|grave)\\b)|you\\s+(?:are|r|look)|you're|ur\\s+(?:mom|mum|mother|mama)|that'?s\\s+you|(?<!\\b(?:to|wanna|gonna|i|we|let'?s|i'll|we'll|never)\\s)go\\s+back)(?![\\p{L}])[^\\n]{0,40}?(?:🐒|🦍|🐵|🦧)|(?:🐒|🦍|🐵|🦧)[^\\n]{0,30}?(?<![\\p{L}])(?:t'es|tu\\s+es|t'?[ée]tais|tu\\s+ressembles?|c'est\\s+toi|comme\\s+toi|toi\\s+le|(?<!(?:\\b(?:les|des|nouvelles?)\\s|[ld]'|\\d\\s))esp[èe]ces?\\s+d['e]|bande\\s+d['e](?!\\s*\\p{L}+\\s+(?:a|ont|est|sont|vit|vivent|s'est|se\\s+sont)(?![\\p{L}]))|ta\\s+race|(?<!je\\s)(?<!on\\s)(?:retourne\\s+(?:dans|en|chez|au)|rentre\\s+chez)|(?<!\\b(?:ça|ca)\\s)d[ée]gage(?!\\s+(?:tellement|trop|grave)\\b)|you\\s+(?:are|r|look)|you're|ur\\s+(?:mom|mum|mother|mama)|that'?s\\s+you|(?<!\\b(?:to|wanna|gonna|i|we|let'?s|i'll|we'll|never)\\s)go\\s+back)(?![\\p{L}])|(?<![\\p{L}])sales?\\s*(?:🐒|🦍|🐵|🦧)",
        flags: "iu",
        note: "Emoji singe adressé à quelqu'un (t'es, c'est toi, sale, you are…). Le zoo sans adresse passe, comme « je retourne au zoo », « I want to go back to Bali » ou « une nouvelle espèce de singe » ou « une bande de singes a envahi le village »."
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
        requireAttackCompanion: true,
        note: "Insulte raciste visant les Noirs. Ne compte qu'avec un autre signal : c'est aussi le tison du feu."
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
        terms: ["mongoloide", "mongoloides"],
        note: "Insultes validistes. « retardado » passe par les motifs : il veut aussi dire « retardé » (« efeito retardado »)."
      },
      {
        id: "bl-pt-insults",
        category: "insult",
        weight: 0.7,
        terms: [
          "filho da puta",
          "filha da puta",
          "filhos da puta",
          "otário",
          "otario",
          "babaca",
          "babacas",
          "desgraçado",
          "desgraçada",
          "cuzão",
          "cuzao",
          "pau no cu",
          "lixo humano",
          "imbecil",
          "imbecis"
        ],
        note: "Insultes. « arrombado » et « escroto » passent par les motifs : ils veulent aussi dire « forcé » et « scrotum »."
      },
      {
        id: "bl-pt-profanity",
        category: "profanity",
        weight: 0.5,
        terms: ["porra", "caralho", "merda", "foda-se", "puta que pariu", "pqp", "cacete", "buceta"],
        note: "Jurons, masqués seulement si le filtre vulgarité est activé."
      }
    ],
    patterns: [
      {
        id: "pat-pt-imundo",
        category: "racism",
        weight: 0.85,
        pattern: "(?<![\\p{L}\\p{N}])(?:(?:(?:pret|negr|cigan|crioul)[oa]s?|ti[cç](?:[aã]o|[oõ]es))\\s+(?:(?:imund|fedid|nojent|safad)[oa]s?|ladr(?:[aã]o|[oõ]es)|(?:suj[oa]s?\\s+)?de\\s+merda|suj[oa]s?\\s+do\\s+caralho)|(?:seu|sua|seus|suas|esse|essa|esses|essas)\\s+(?:pret|negr|cigan|crioul)[oa]s?\\s+suj[oa]s?|macac[oa]s?\\s+(?:(?:imund|fedid|nojent)[oa]s?|de\\s+merda))(?![\\p{L}\\p{N}])",
        flags: "iu",
        note: "Couleur ou origine + insulte (« preto imundo », « crioulo de merda »). Avec « sujo », il faut une adresse (« seu preto sujo ») : « a camisa preta suja » passe, comme le singe des faits divers (« macaco ladrão rouba celular »)."
      },
      {
        id: "pat-pt-monkey",
        category: "racism",
        weight: 0.75,
        pattern: "\\b(?:seu|sua|seus|suas)\\s+(?:macac[oa]s?|gorilas?|primatas?)(?=\\s*(?:$|\\n|[^\\p{L}\\p{N}\\s]|kk|(?:safad|pret|negr)[oa]s?\\b))|(?:(?<![\\p{L}\\p{N}][^\\S\\n]*)|\\bcala\\s+(?:a\\s+)?boca\\s+e\\s+)(?:volta\\s+(?:pra|para)\\s+(?:a\\s+)?jaula|vai\\s+comer\\s+banana(?=\\s*(?:$|\\n|[^\\p{L}\\p{N}\\s?]|kk|macac)))\\b",
        flags: "iu",
        note: "« seu macaco! » et, en début de phrase ou après « cala a boca e », « volta pra jaula » ou « vai comer banana, macaco ». Passent : le cric (« use seu macaco hidráulico »), la peluche, « seu macaco velho » (vieux renard), « o bebê vai comer banana » et la question « vai comer banana ou maçã? »."
      },
      {
        id: "pat-pt-go-home",
        category: "racism",
        weight: 0.75,
        pattern: "\\b(?:volta|volte|voltem|vai\\s+embora|vão\\s+embora)\\s+(?:pra|para|pro)\\s+(?:o\\s+|a\\s+)?(?:teu|tua)\\s+(?:pa[ií]s|terra)\\b|(?:(?<![\\p{L}\\p{N}][^\\S\\n]*)|\\bcala\\s+(?:a\\s+)?boca\\s+e\\s+)(?:(?:volta|volte|voltem|vai\\s+embora|vão\\s+embora)\\s+(?:pra|para|pro)\\s+(?:o\\s+|a\\s+)?(?:seu|sua)\\s+(?:pa[ií]s|terra)|(?:volta|volte|voltem)\\s+(?:pra|para)\\s+(?:a\\s+)?[aá]frica(?!\\s+do\\s+sul))\\b|\\b(?:volta|vai|volte)\\s+(?:pra|para)\\s+(?:a\\s+)?senzala\\b|\\blugar\\s+de\\s+pret[oa]\\s+[eé]\\s+na\\s+senzala\\b",
        flags: "iu",
        note: "« volta pro teu país », « volta pra senzala ». Avec « seu » ou l'Afrique, le verbe doit ouvrir la phrase ou suivre « cala a boca e » : « ele volta para o seu país » et « o presidente vai para a África » passent."
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
        pattern: "(?:(?<![\\p{L}\\p{N}][^\\S\\n]*)|\\bcala\\s+(?:a\\s+)?boca\\s+e\\s+)volta\\s+(?:pra|para)\\s+(?:a\\s+)?cozinha\\b|\\blugar\\s+de\\s+mulher\\s+[eé]\\s+na\\s+cozinha\\b|\\b(?:vadia|piranha|vagabunda|puta)\\s+(?:de\\s+merda|imunda|nojenta)\\b",
        flags: "iu",
        note: "Sexisme. « volta pra cozinha » ne compte qu'en début de phrase ou après « cala a boca e » : « o chef volta para a cozinha » passe."
      },
      {
        id: "pat-pt-ableist",
        category: "hate",
        weight: 0.6,
        pattern: "\\b(?:(?:voc[eê]\\s+[eé]\\s+(?:um\\s+|uma\\s+)?|(?:seu|sua|seus|suas|esse|essa|esses|essas|um|uma|uns|umas|que|bando\\s+de)\\s+)retardad[oa]s?|(?:voc[eê]\\s+[eé]\\s+(?:um\\s+|uma\\s+)?|(?:seu|sua)\\s+)down|voc[eê]\\s+[eé]\\s+(?:um|uma)\\s+autista)\\b",
        flags: "iu",
        note: "Handicap utilisé comme insulte (« seu retardado », « bando de retardados »). « efeito retardado » et la question « você é autista? » passent."
      },
      {
        id: "pat-pt-threat",
        category: "threat",
        weight: 0.8,
        pattern: "\\b(?:vou\\s+te\\s+(?:matar|quebrar(?!\\s+(?:um|o)\\s+galho)|pegar\\s+(?:l[aá]\\s+fora|de\\s+porrada|na\\s+porrada))|(?<!\\b(?:ele|ela|voc[eê]|vc|c[eê]|tu|que|quem|algu[eé]m|ningu[eé]m|n[aã]o)\\s+)vai\\s+se\\s+matar|(?:(?<![\\p{L}\\p{N}][^\\S\\n]*)|(?:vai|ent[aã]o)\\s+)se\\s+mata(?!\\s+(?:a|al|el|la|en|un|una|em|na|no|um|uma)\\b)|tomara\\s+que\\s+(?:voc[eê]\\s+|vc\\s+)?(?:morra|morram|seja\\s+morto)|(?<!\\b(?:ningu[eé]m|n[aã]o)\\s+)merece\\s+morrer|(?:voc[eê]|vc|tu|voc[eê]s|eles|essa\\s+gente)\\s+(?:tem|t[eê]m|tens)\\s+que\\s+(?:morrer|ser\\s+mort[oa]s?)|bandido\\s+bom\\s+[eé]\\s+bandido\\s+morto)(?!\\s+de\\s+(?:rir|trabalhar|estudar|tanto|saudades?|vergonha|inveja|ci[uú]mes?|t[eé]dio|susto|amor|raiva|curiosidade|beijos|abra[cç]os|c[oó]cegas)\\b)\\b",
        flags: "iu",
        note: "Menaces. « se mata » ne compte qu'en début de phrase ou après « vai » et « então ». Passent : « vou te pegar no aeroporto », « vou te quebrar um galho », « vou te matar de saudade », « ele vai se matar de rir », « ninguém merece morrer », « o vilão se mata no final »."
      },
      {
        id: "pat-pt-directed-insult",
        category: "insult",
        weight: 0.6,
        pattern: "\\b(?:voc[eê]\\s+[eé]\\s+(?:um\\s+|uma\\s+)?(?:idiota|burr[oa]|lixo|vagabund[oa]|corno|palha[çc]o|in[uú]til)|(?:seu|(?<!\\b(?:la|una|della|alla|nella|dalla|sulla|questa|quella)\\s+)sua)\\s+(?:idiota|vagabund[oa]|corno|in[uú]til|(?:burr[oa]|palha[çc]o)(?!\\s+(?:de\\s+carga|para(?!\\s+(?:de|com)\\b)|pra|pro|na|no|em)\\b)|lixo(?=\\s*(?:$|\\n|[^\\p{L}\\p{N}\\s]|kk|de\\s+merda|do\\s+caralho))))\\b",
        flags: "iu",
        note: "Insulte adressée (« seu idiota »). « seu lixo » ne compte qu'en fin de phrase. Passent : « separe seu lixo para a reciclagem », « contrate seu palhaço para festas » et l'italien « la sua idiota proposta »."
      },
      {
        id: "pat-pt-ambiguous-insult",
        category: "insult",
        weight: 0.7,
        pattern: "\\b(?:(?:voc[eê]\\s+[eé]\\s+(?:um\\s+|uma\\s+|muito\\s+|t[aã]o\\s+)?|(?:seu|sua|seus|suas|esse|essa|esses|essas|um|uma|uns|umas|que|cara|bando\\s+de)\\s+)(?:arrombad|escrot)[oa]s?|(?:arrombad|escrot)[oa]s?\\s+(?:do\\s+caralho|de\\s+merda))\\b",
        flags: "iu",
        note: "Insultes qui ont un autre sens, comptées seulement quand elles visent quelqu'un : « seu arrombado », « que escroto ». « a porta foi arrombada » et « dor no escroto » passent, en portugais comme en espagnol."
      }
    ]
  };

  // extension/detection/lists.js
  var LISTS = (
    /** @type {any} */
    { fr: fr_default, en: en_default, es: es_default, pt: pt_default, it: it_default, de: de_default, ar: ar_default, multi: multi_default }
  );

  // extension/detection/normalize.js
  var INVISIBLE = new RegExp("\\p{Default_Ignorable_Code_Point}", "gu");
  var COMBINING_MARKS = /[\u0300-\u036F\u0483-\u0489\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/g;
  var ARABIC_MARKS = /[\u0640\u064B-\u065F\u0670]/g;
  var ARABIC_SPELLINGS = { أ: "ا", إ: "ا", آ: "ا", ٱ: "ا", ى: "ي", ک: "ك" };
  var ARABIC_SPELLING_RE = new RegExp(`[${Object.keys(ARABIC_SPELLINGS).join("")}]`, "g");
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
  var LEET_RE = new RegExp(`[1${[...Object.keys(LEET_DIGITS), ...Object.keys(LEET_SYMBOLS)].join("")}]`);
  var TOKEN_RE = /[\p{L}\p{M}\p{N}@$€!|'‘’]+/gu;
  var LETTER_RE = new RegExp("\\p{L}", "gu");
  var SPACED_RE = /(?<![\p{L}\p{N}])[\p{L}\p{N}]([ .\-_·•*+~/])[\p{L}\p{N}](?:\1[\p{L}\p{N}])+(?![\p{L}\p{N}])/gu;
  var STRETCHED_RE = new RegExp("(\\p{L})\\1{2,}", "gu");
  function unifyArabic(text) {
    return text.replace(ARABIC_SPELLING_RE, (c) => ARABIC_SPELLINGS[c]);
  }
  function plainArabic(text) {
    return unifyArabic(text.replace(ARABIC_MARKS, ""));
  }
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
      if (!LEET_RE.test(word) || (word.match(LETTER_RE) ?? []).length < 2) return word;
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
    const clean = text.replace(INVISIBLE, "").normalize("NFKC").replace(COMBINING_MARKS, "").replace(ARABIC_MARKS, "");
    const base = mapHomoglyphs(joinSpacedLetters(unifyArabic(clean)));
    const withI = mapLeet(base, "i");
    const variants = /* @__PURE__ */ new Map([
      [withI, false],
      [withI.replace(STRETCHED_RE, "$1"), false]
    ]);
    const twoLetters = withI.replace(STRETCHED_RE, "$1$1");
    if (!variants.has(twoLetters)) variants.set(twoLetters, true);
    if (base.includes("1")) variants.set(mapLeet(base, "l"), false);
    variants.delete(text);
    return [...variants].map(([variant, doubled]) => ({ text: variant, doubled }));
  }

  // extension/detection/score.js
  var VERSION = manifest_default.version;
  var THRESHOLDS = {
    low: { blur: 0.7, collapse: 0.9 },
    medium: { blur: 0.5, collapse: 0.75 },
    high: { blur: 0.35, collapse: 0.6 }
  };
  var MASKED_WEIGHT = 0.6;
  var WORD_CHARS = "\\p{L}\\p{N}_";
  var WORD_START = `(?<![${WORD_CHARS}])`;
  var WORD_END = `(?![${WORD_CHARS}])`;
  var APOSTROPHES = "'‘’ʼ";
  var APOSTROPHE_RE = new RegExp(`[${APOSTROPHES}]`, "g");
  var SEPARATOR_CHARS = "\\s\\p{Pd}_";
  var SEPARATOR = `[${SEPARATOR_CHARS}]+`;
  var INNER_SEPARATOR_RE = new RegExp(`(?<=[^${SEPARATOR_CHARS}])${SEPARATOR}(?=[^${SEPARATOR_CHARS}])`, "u");
  var escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var splitWords = (term) => term.split(INNER_SEPARATOR_RE);
  var termSource = (term) => splitWords(term).map((word) => escapeRegExp(word).replace(APOSTROPHE_RE, `[${APOSTROPHES}]`)).join(SEPARATOR);
  var wordsRegExp = (terms) => new RegExp(
    `${WORD_START}(?:${[...terms].sort((a, b) => b.length - a.length).map(termSource).join("|")})${WORD_END}`,
    "iu"
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
  var MASK_RE = /[*#]/;
  var MASKABLE_RE = /^[\p{L}\p{N}]{5,}$/u;
  var maskedTokens = (text) => MASK_RE.test(text) ? (text.toLowerCase().match(/[\p{L}\p{N}*#]+/gu) ?? []).filter((w) => MASK_RE.test(w)).map((w) => [...w]) : [];
  function compileTermRule(entry) {
    const terms = entry.terms.map(unifyArabic);
    const glued = terms.map(splitWords).filter((words) => words.length > 1).map((words) => words.join(""));
    return {
      entry,
      exact: wordsRegExp(terms),
      glued: glued.length ? wordsRegExp(glued) : null,
      // Une expression masquée se compare collée : « k*somak ».
      masked: [.../* @__PURE__ */ new Set([...terms, ...glued])].filter((term) => MASKABLE_RE.test(term)).map((term) => [...term.toLowerCase()])
    };
  }
  var TERM_RULES = Object.values(LISTS).flatMap((list) => list.terms.map(compileTermRule));
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
          (word, i) => compileTermRule({
            id: `custom-${i}`,
            category: "custom",
            weight: 1,
            // Les pluriels réguliers sont pris aussi ; un pluriel irrégulier
            // (chevaux) s'écrit sur sa propre ligne.
            terms: [.../* @__PURE__ */ new Set([word, `${word}s`, `${word}es`, `${word}x`])],
            note: ""
          })
        )
      };
    }
    return customCache.rules;
  }
  var OPENS_WORD = /^(?:[\p{L}\d_]|\[(?!\^|\\[sS])|\((?!\?[=!<])|\\[pw])/u;
  var LOOKBEHIND_RE = /^\(\?<[=!]/;
  function afterLookbehinds(rest) {
    while (LOOKBEHIND_RE.test(rest)) {
      let depth = 0;
      let inClass = false;
      let i = 0;
      for (; i < rest.length; i++) {
        const c = rest[i];
        if (c === "\\") i++;
        else if (inClass) inClass = c !== "]";
        else if (c === "[") inClass = true;
        else if (c === "(") depth++;
        else if (c === ")" && --depth === 0) break;
      }
      rest = rest.slice(i + 1);
    }
    return rest;
  }
  function compilePattern(entry) {
    const pattern = unifyArabic(entry.pattern);
    let source = "";
    let inClass = false;
    for (let i = 0; i < pattern.length; i++) {
      const c = pattern[i];
      if (c === "\\") {
        const next = pattern[++i];
        if (next === "w") source += inClass ? WORD_CHARS : `[${WORD_CHARS}]`;
        else if (next === "b" && !inClass)
          source += OPENS_WORD.test(afterLookbehinds(pattern.slice(i + 1))) ? WORD_START : WORD_END;
        else source += c + next;
      } else if (APOSTROPHES.includes(c)) {
        source += inClass ? APOSTROPHES : `[${APOSTROPHES}]`;
      } else {
        if (c === "[") inClass = true;
        else if (c === "]") inClass = false;
        source += c;
      }
    }
    return new RegExp(source, entry.flags.includes("u") ? entry.flags : `${entry.flags}u`);
  }
  var PATTERN_RULES = Object.values(LISTS).flatMap(
    (list) => list.patterns.map((entry) => ({ entry, re: compilePattern(entry) }))
  );
  function* warmUpSteps(customTerms = []) {
    const rules = [...TERM_RULES, ...customRules(customTerms)];
    const regexes = [
      ...rules.flatMap((rule) => rule.glued ? [rule.exact, rule.glued] : [rule.exact]),
      ...PATTERN_RULES.map((rule) => rule.re)
    ];
    for (const re of regexes) {
      for (const sample of ["a b", "a 🐒"]) re.exec(sample);
      yield;
    }
    scoreText({ text: "warm up b*ugnoule 🐒", customTerms });
  }
  function findTerm(rule, text, masked) {
    const exact = rule.exact.exec(text);
    if (exact) return { term: exact[0] };
    const glued = rule.glued?.exec(text);
    if (glued) return { term: glued[0], via: "glued" };
    for (const token of masked) {
      const term = rule.masked.find((t2) => maskedEquals(token, t2));
      if (term) return { term: term.join(""), via: "masked" };
    }
    return null;
  }
  function matchTerms(text, rules, doubled) {
    const hits = [];
    const masked = maskedTokens(text);
    for (const rule of rules) {
      const { entry } = rule;
      if (doubled && entry.strictDoubles) continue;
      const found = findTerm(rule, text, masked);
      if (!found) continue;
      const weight = found.via === "masked" && entry.category !== "custom" ? Math.round(entry.weight * MASKED_WEIGHT * 1e3) / 1e3 : entry.weight;
      hits.push({
        layer: "blocklist",
        id: entry.id,
        termOrPattern: found.term,
        weight,
        category: entry.category,
        gated: entry.requireAttackCompanion === true,
        via: found.via
      });
    }
    return hits;
  }
  function matchPatterns(text, doubled, scope) {
    const hits = [];
    for (const { entry, re } of PATTERN_RULES) {
      if (doubled && entry.strictDoubles || scope === "name" && entry.wholeMessage || !re.test(text)) continue;
      hits.push({
        layer: "pattern",
        id: entry.id,
        termOrPattern: entry.pattern,
        weight: entry.weight,
        category: entry.category,
        gated: false
      });
    }
    return hits;
  }
  function collectHits(text, termRules, muted, scope) {
    const best = /* @__PURE__ */ new Map();
    const origin = plainArabic(text);
    const variants = textVariants(text).filter((v) => v.text !== origin);
    [{ text: origin, doubled: false }, ...variants].forEach(({ text: variant, doubled }, i) => {
      for (const hit of [...matchTerms(variant, termRules, doubled), ...matchPatterns(variant, doubled, scope)]) {
        if (i > 0) hit.via ??= "norm";
        const previous = best.get(hit.id);
        if (!previous || hit.weight > previous.weight) best.set(hit.id, hit);
      }
    });
    const hits = [...best.values()].filter((h2) => !muted.has(h2.id));
    const hasCompanion = hits.some((h2) => !h2.gated && h2.category !== "profanity");
    return hits.filter((h2) => !h2.gated || hasCompanion);
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
    sensitivity = "medium",
    categories = DEFAULT_CATEGORIES,
    customTerms = [],
    mutedRules = [],
    scope = "message"
  }) {
    const empty = !text.trim();
    const enabled = /* @__PURE__ */ new Set([...categories, "custom"]);
    const rules = customTerms.length ? [...TERM_RULES, ...customRules(customTerms)] : TERM_RULES;
    const hits = empty ? [] : collectHits(text, rules, new Set(mutedRules), scope).filter((h2) => enabled.has(h2.category));
    const total = hits.reduce((sum, h2) => sum + h2.weight, 0);
    const score = Math.round(Math.min(1, total) * 1e3) / 1e3;
    const action = actionOf(score, sensitivity);
    return {
      match: action !== "pass",
      action,
      score,
      categories: rankCategories(hits),
      matches: hits.map(({ layer, id, termOrPattern, weight }) => ({ layer, id, termOrPattern, weight })),
      reasonLocal: empty ? "empty" : hits.map((h2) => `${h2.layer}:${h2.id}${h2.via ? `~${h2.via}` : ""}`).join(", ") || "no_hit",
      version: VERSION
    };
  }

  // extension/_locales/en/messages.json
  var messages_default = {
    extDescription: {
      message: "Blurs hate on X while you scroll: racism, threats, insults. Locally, on your device.",
      description: "Description de la fiche"
    },
    reveal: {
      message: "Show anyway",
      description: "Bouton sur un tweet masqué"
    },
    rehide: {
      message: "Hide",
      description: "Bouton sous un tweet révélé"
    },
    rehideLabel: {
      message: "Hide again",
      description: "Libellé accessible"
    },
    notHate: {
      message: "Not hate",
      description: "Bouton sous un tweet révélé"
    },
    notHateTitle: {
      message: "Stop hiding this kind of message",
      description: "Infobulle"
    },
    allowAccount: {
      message: "Allow @$HANDLE$",
      description: "Bouton sous un tweet révélé",
      placeholders: {
        handle: {
          content: "$1"
        }
      }
    },
    allowAccountTitle: {
      message: "Never hide posts from this account",
      description: "Infobulle"
    },
    category_racism: {
      message: "Racism",
      description: "Filtre"
    },
    category_racism_description: {
      message: 'Racist slurs, "go back to your country", xenophobia.',
      description: "Filtre"
    },
    category_hate: {
      message: "Other hate",
      description: "Filtre"
    },
    category_hate_description: {
      message: "Religion, homophobia and transphobia, disability, sexism.",
      description: "Filtre"
    },
    category_threat: {
      message: "Threats",
      description: "Filtre"
    },
    category_threat_description: {
      message: "Death threats, calls for violence.",
      description: "Filtre"
    },
    category_insult: {
      message: "Insults",
      description: "Filtre"
    },
    category_insult_description: {
      message: "Insults aimed at someone.",
      description: "Filtre"
    },
    category_profanity: {
      message: "Profanity",
      description: "Filtre"
    },
    category_profanity_description: {
      message: "Swear words, even with no target.",
      description: "Filtre"
    },
    category_custom: {
      message: "Your word",
      description: "Motif d'un mot perso"
    },
    hudCountOne: {
      message: "$COUNT$ hidden",
      description: "Compteur",
      placeholders: {
        count: {
          content: "$1"
        }
      }
    },
    hudCountMany: {
      message: "$COUNT$ hidden",
      description: "Compteur",
      placeholders: {
        count: {
          content: "$1"
        }
      }
    },
    hudMove: {
      message: "Arrow keys: move the counter",
      description: "Compteur"
    },
    popupSubtitle: {
      message: "Local filter for X",
      description: "Popup"
    },
    popupToggle: {
      message: "Turn Voyou on or off",
      description: "Popup"
    },
    popupOn: {
      message: "On for x.com",
      description: "Popup"
    },
    popupOff: {
      message: "Off: nothing is hidden",
      description: "Popup"
    },
    popupNoAccess: {
      message: "No access to x.com: nothing is hidden",
      description: "Popup"
    },
    popupGrant: {
      message: "Allow access to x.com",
      description: "Popup"
    },
    popupGrantHint: {
      message: "Then reload your X tabs.",
      description: "Popup"
    },
    popupHide: {
      message: "Hide",
      description: "Popup"
    },
    popupSensitivity: {
      message: "Sensitivity",
      description: "Popup"
    },
    sensitivity_low: {
      message: "Relaxed",
      description: "Popup"
    },
    sensitivity_medium: {
      message: "Balanced",
      description: "Popup"
    },
    sensitivity_high: {
      message: "Strict",
      description: "Popup"
    },
    popupSensitivityHint: {
      message: "Strict hides more messages, with more possible mistakes.",
      description: "Popup"
    },
    popupCustom: {
      message: "Words to hide",
      description: "Popup"
    },
    popupCustomHint: {
      message: "One word or phrase per line (up to $TERMS$ lines of $LENGTH$ characters). Always hidden, including plurals ending in -s or -es.",
      description: "Popup",
      placeholders: {
        terms: {
          content: "$1"
        },
        length: {
          content: "$2"
        }
      }
    },
    popupAllowed: {
      message: "Allowed accounts",
      description: "Popup"
    },
    popupAllowedHint: {
      message: "One account per line. Their posts are never hidden.",
      description: "Popup"
    },
    popupAllowedPlaceholder: {
      message: "@account",
      description: "Popup"
    },
    popupMuted: {
      message: "Ignored rules",
      description: "Popup"
    },
    popupMutedHint: {
      message: 'Turned off with "Not hate".',
      description: "Popup"
    },
    popupMutedRestore: {
      message: "Turn back on",
      description: "Popup"
    },
    mutedTerm: {
      message: '$CATEGORY$: "$TERM$"',
      description: "Règle ignorée : un mot",
      placeholders: {
        category: {
          content: "$1"
        },
        term: {
          content: "$2"
        }
      }
    },
    mutedPattern: {
      message: "$CATEGORY$: phrase ($LANGUAGE$)",
      description: "Règle ignorée : une tournure, et la langue de sa liste",
      placeholders: {
        category: {
          content: "$1"
        },
        language: {
          content: "$2"
        }
      }
    },
    mutedPatternAnyLanguage: {
      message: "$CATEGORY$: phrase (any language)",
      description: "Règle ignorée : une tournure valable dans toutes les langues",
      placeholders: {
        category: {
          content: "$1"
        }
      }
    },
    popupStats: {
      message: "Last $DAYS$ days",
      description: "Popup",
      placeholders: {
        days: {
          content: "$1"
        }
      }
    },
    popupStatsTotalOne: {
      message: "$COUNT$ message hidden",
      description: "Popup",
      placeholders: {
        count: {
          content: "$1"
        }
      }
    },
    popupStatsTotalMany: {
      message: "$COUNT$ messages hidden",
      description: "Popup",
      placeholders: {
        count: {
          content: "$1"
        }
      }
    },
    popupStatsEmpty: {
      message: "Nothing hidden in the last $DAYS$ days.",
      description: "Popup",
      placeholders: {
        days: {
          content: "$1"
        }
      }
    },
    popupFooter: {
      message: "Everything stays on your device. Voyou never reports or blocks anyone.",
      description: "Popup"
    },
    hudOpen: {
      message: "Open Voyou settings",
      description: "Module flottant"
    },
    panelClose: {
      message: "Close",
      description: "Module flottant"
    },
    panelPage: {
      message: "On this page: $HIDDEN$",
      description: "Module flottant",
      placeholders: {
        hidden: {
          content: "$1"
        }
      }
    }
  };

  // extension/_locales/es/messages.json
  var messages_default2 = {
    extDescription: {
      message: "Difumina el odio en X mientras navegas: racismo, amenazas, insultos. En local, en tu dispositivo.",
      description: "Description de la fiche"
    },
    reveal: {
      message: "Mostrar de todos modos",
      description: "Bouton sur un tweet masqué"
    },
    rehide: {
      message: "Ocultar",
      description: "Bouton sous un tweet révélé"
    },
    rehideLabel: {
      message: "Ocultar de nuevo",
      description: "Libellé accessible"
    },
    notHate: {
      message: "No es odio",
      description: "Bouton sous un tweet révélé"
    },
    notHateTitle: {
      message: "Dejar de ocultar este tipo de mensaje",
      description: "Infobulle"
    },
    allowAccount: {
      message: "Permitir @$HANDLE$",
      description: "Bouton sous un tweet révélé",
      placeholders: {
        handle: {
          content: "$1"
        }
      }
    },
    allowAccountTitle: {
      message: "No ocultar nunca las publicaciones de esta cuenta",
      description: "Infobulle"
    },
    category_racism: {
      message: "Racismo",
      description: "Filtre"
    },
    category_racism_description: {
      message: "Insultos racistas, «vuelve a tu país», xenofobia.",
      description: "Filtre"
    },
    category_hate: {
      message: "Otros odios",
      description: "Filtre"
    },
    category_hate_description: {
      message: "Religión, homofobia y transfobia, discapacidad, sexismo.",
      description: "Filtre"
    },
    category_threat: {
      message: "Amenazas",
      description: "Filtre"
    },
    category_threat_description: {
      message: "Amenazas de muerte, llamadas a la violencia.",
      description: "Filtre"
    },
    category_insult: {
      message: "Insultos",
      description: "Filtre"
    },
    category_insult_description: {
      message: "Insultos dirigidos a alguien.",
      description: "Filtre"
    },
    category_profanity: {
      message: "Groserías",
      description: "Filtre"
    },
    category_profanity_description: {
      message: "Palabrotas, aunque no vayan contra nadie.",
      description: "Filtre"
    },
    category_custom: {
      message: "Palabra elegida",
      description: "Motif d'un mot perso"
    },
    hudCountOne: {
      message: "$COUNT$ oculto",
      description: "Compteur",
      placeholders: {
        count: {
          content: "$1"
        }
      }
    },
    hudCountMany: {
      message: "$COUNT$ ocultos",
      description: "Compteur",
      placeholders: {
        count: {
          content: "$1"
        }
      }
    },
    hudMove: {
      message: "Flechas del teclado: mover el contador",
      description: "Compteur"
    },
    popupSubtitle: {
      message: "Filtro local para X",
      description: "Popup"
    },
    popupToggle: {
      message: "Activar o desactivar Voyou",
      description: "Popup"
    },
    popupOn: {
      message: "Activado en x.com",
      description: "Popup"
    },
    popupOff: {
      message: "Desactivado: no se oculta nada",
      description: "Popup"
    },
    popupNoAccess: {
      message: "Sin acceso a x.com: no se oculta nada",
      description: "Popup"
    },
    popupGrant: {
      message: "Permitir el acceso a x.com",
      description: "Popup"
    },
    popupGrantHint: {
      message: "Después, recarga tus pestañas de X.",
      description: "Popup"
    },
    popupHide: {
      message: "Ocultar",
      description: "Popup"
    },
    popupSensitivity: {
      message: "Sensibilidad",
      description: "Popup"
    },
    sensitivity_low: {
      message: "Flexible",
      description: "Popup"
    },
    sensitivity_medium: {
      message: "Equilibrada",
      description: "Popup"
    },
    sensitivity_high: {
      message: "Estricta",
      description: "Popup"
    },
    popupSensitivityHint: {
      message: "Estricta oculta más mensajes, con más errores posibles.",
      description: "Popup"
    },
    popupCustom: {
      message: "Palabras que ocultar",
      description: "Popup"
    },
    popupCustomHint: {
      message: "Una palabra o expresión por línea (hasta $TERMS$ líneas de $LENGTH$ caracteres). Siempre ocultas, plurales en -s y -es incluidos.",
      description: "Popup",
      placeholders: {
        terms: {
          content: "$1"
        },
        length: {
          content: "$2"
        }
      }
    },
    popupAllowed: {
      message: "Cuentas permitidas",
      description: "Popup"
    },
    popupAllowedHint: {
      message: "Una cuenta por línea. Sus publicaciones nunca se ocultan.",
      description: "Popup"
    },
    popupAllowedPlaceholder: {
      message: "@cuenta",
      description: "Popup"
    },
    popupMuted: {
      message: "Reglas ignoradas",
      description: "Popup"
    },
    popupMutedHint: {
      message: "Desactivadas con «No es odio».",
      description: "Popup"
    },
    popupMutedRestore: {
      message: "Reactivar",
      description: "Popup"
    },
    mutedTerm: {
      message: "$CATEGORY$: «$TERM$»",
      description: "Règle ignorée : un mot",
      placeholders: {
        category: {
          content: "$1"
        },
        term: {
          content: "$2"
        }
      }
    },
    mutedPattern: {
      message: "$CATEGORY$: expresión ($LANGUAGE$)",
      description: "Règle ignorée : une tournure, et la langue de sa liste",
      placeholders: {
        category: {
          content: "$1"
        },
        language: {
          content: "$2"
        }
      }
    },
    mutedPatternAnyLanguage: {
      message: "$CATEGORY$: expresión (todos los idiomas)",
      description: "Règle ignorée : une tournure valable dans toutes les langues",
      placeholders: {
        category: {
          content: "$1"
        }
      }
    },
    popupStats: {
      message: "Últimos $DAYS$ días",
      description: "Popup",
      placeholders: {
        days: {
          content: "$1"
        }
      }
    },
    popupStatsTotalOne: {
      message: "$COUNT$ mensaje oculto",
      description: "Popup",
      placeholders: {
        count: {
          content: "$1"
        }
      }
    },
    popupStatsTotalMany: {
      message: "$COUNT$ mensajes ocultos",
      description: "Popup",
      placeholders: {
        count: {
          content: "$1"
        }
      }
    },
    popupStatsEmpty: {
      message: "Nada oculto en los últimos $DAYS$ días.",
      description: "Popup",
      placeholders: {
        days: {
          content: "$1"
        }
      }
    },
    popupFooter: {
      message: "Todo se queda en tu dispositivo. Voyou no denuncia ni bloquea a nadie.",
      description: "Popup"
    },
    hudOpen: {
      message: "Abrir los ajustes de Voyou",
      description: "Module flottant"
    },
    panelClose: {
      message: "Cerrar",
      description: "Module flottant"
    },
    panelPage: {
      message: "En esta página: $HIDDEN$",
      description: "Module flottant",
      placeholders: {
        hidden: {
          content: "$1"
        }
      }
    }
  };

  // extension/_locales/fr/messages.json
  var messages_default3 = {
    extDescription: {
      message: "Floute la haine sur X pendant que tu scrolles : racisme, menaces, insultes. En local, sur ton appareil.",
      description: "Description de la fiche"
    },
    reveal: {
      message: "Afficher quand même",
      description: "Bouton sur un tweet masqué"
    },
    rehide: {
      message: "Masquer",
      description: "Bouton sous un tweet révélé"
    },
    rehideLabel: {
      message: "Masquer à nouveau",
      description: "Libellé accessible"
    },
    notHate: {
      message: "Ce n'est pas de la haine",
      description: "Bouton sous un tweet révélé"
    },
    notHateTitle: {
      message: "Ne plus masquer ce type de message",
      description: "Infobulle"
    },
    allowAccount: {
      message: "Autoriser @$HANDLE$",
      description: "Bouton sous un tweet révélé",
      placeholders: {
        handle: {
          content: "$1"
        }
      }
    },
    allowAccountTitle: {
      message: "Ne jamais masquer les posts de ce compte",
      description: "Infobulle"
    },
    category_racism: {
      message: "Racisme",
      description: "Filtre"
    },
    category_racism_description: {
      message: "Insultes racistes, « retourne dans ton pays », xénophobie.",
      description: "Filtre"
    },
    category_hate: {
      message: "Autres haines",
      description: "Filtre"
    },
    category_hate_description: {
      message: "Religion, homophobie et transphobie, handicap, sexisme.",
      description: "Filtre"
    },
    category_threat: {
      message: "Menaces",
      description: "Filtre"
    },
    category_threat_description: {
      message: "Menaces de mort, appels à la violence.",
      description: "Filtre"
    },
    category_insult: {
      message: "Insultes",
      description: "Filtre"
    },
    category_insult_description: {
      message: "Insultes adressées à quelqu'un.",
      description: "Filtre"
    },
    category_profanity: {
      message: "Vulgarité",
      description: "Filtre"
    },
    category_profanity_description: {
      message: "Jurons, même sans personne visée.",
      description: "Filtre"
    },
    category_custom: {
      message: "Mot choisi",
      description: "Motif d'un mot perso"
    },
    hudCountOne: {
      message: "$COUNT$ masqué",
      description: "Compteur",
      placeholders: {
        count: {
          content: "$1"
        }
      }
    },
    hudCountMany: {
      message: "$COUNT$ masqués",
      description: "Compteur",
      placeholders: {
        count: {
          content: "$1"
        }
      }
    },
    hudMove: {
      message: "Flèches du clavier : déplacer le compteur",
      description: "Compteur"
    },
    popupSubtitle: {
      message: "Filtre local sur X",
      description: "Popup"
    },
    popupToggle: {
      message: "Activer ou couper Voyou",
      description: "Popup"
    },
    popupOn: {
      message: "Activé sur x.com",
      description: "Popup"
    },
    popupOff: {
      message: "Désactivé : rien n'est masqué",
      description: "Popup"
    },
    popupNoAccess: {
      message: "Pas d'accès à x.com : rien n'est masqué",
      description: "Popup"
    },
    popupGrant: {
      message: "Autoriser l'accès à x.com",
      description: "Popup"
    },
    popupGrantHint: {
      message: "Recharge ensuite tes onglets X.",
      description: "Popup"
    },
    popupHide: {
      message: "Masquer",
      description: "Popup"
    },
    popupSensitivity: {
      message: "Sensibilité",
      description: "Popup"
    },
    sensitivity_low: {
      message: "Souple",
      description: "Popup"
    },
    sensitivity_medium: {
      message: "Équilibrée",
      description: "Popup"
    },
    sensitivity_high: {
      message: "Stricte",
      description: "Popup"
    },
    popupSensitivityHint: {
      message: "Stricte masque plus de messages, avec plus d'erreurs possibles.",
      description: "Popup"
    },
    popupCustom: {
      message: "Mots à masquer",
      description: "Popup"
    },
    popupCustomHint: {
      message: "Un mot ou une expression par ligne (jusqu'à $TERMS$ lignes de $LENGTH$ caractères). Toujours masqués, pluriels en -s, -es et -x compris.",
      description: "Popup",
      placeholders: {
        terms: {
          content: "$1"
        },
        length: {
          content: "$2"
        }
      }
    },
    popupAllowed: {
      message: "Comptes autorisés",
      description: "Popup"
    },
    popupAllowedHint: {
      message: "Un compte par ligne. Leurs posts ne sont jamais masqués.",
      description: "Popup"
    },
    popupAllowedPlaceholder: {
      message: "@compte",
      description: "Popup"
    },
    popupMuted: {
      message: "Règles ignorées",
      description: "Popup"
    },
    popupMutedHint: {
      message: "Désactivées avec « Ce n'est pas de la haine ».",
      description: "Popup"
    },
    popupMutedRestore: {
      message: "Réactiver",
      description: "Popup"
    },
    mutedTerm: {
      message: "$CATEGORY$ : « $TERM$ »",
      description: "Règle ignorée : un mot",
      placeholders: {
        category: {
          content: "$1"
        },
        term: {
          content: "$2"
        }
      }
    },
    mutedPattern: {
      message: "$CATEGORY$ : tournure ($LANGUAGE$)",
      description: "Règle ignorée : une tournure, et la langue de sa liste",
      placeholders: {
        category: {
          content: "$1"
        },
        language: {
          content: "$2"
        }
      }
    },
    mutedPatternAnyLanguage: {
      message: "$CATEGORY$ : tournure (toutes langues)",
      description: "Règle ignorée : une tournure valable dans toutes les langues",
      placeholders: {
        category: {
          content: "$1"
        }
      }
    },
    popupStats: {
      message: "$DAYS$ derniers jours",
      description: "Popup",
      placeholders: {
        days: {
          content: "$1"
        }
      }
    },
    popupStatsTotalOne: {
      message: "$COUNT$ message masqué",
      description: "Popup",
      placeholders: {
        count: {
          content: "$1"
        }
      }
    },
    popupStatsTotalMany: {
      message: "$COUNT$ messages masqués",
      description: "Popup",
      placeholders: {
        count: {
          content: "$1"
        }
      }
    },
    popupStatsEmpty: {
      message: "Rien de masqué ces $DAYS$ derniers jours.",
      description: "Popup",
      placeholders: {
        days: {
          content: "$1"
        }
      }
    },
    popupFooter: {
      message: "Tout reste sur ton appareil. Voyou ne signale ni ne bloque personne.",
      description: "Popup"
    },
    hudOpen: {
      message: "Ouvrir les réglages de Voyou",
      description: "Module flottant"
    },
    panelClose: {
      message: "Réduire",
      description: "Module flottant"
    },
    panelPage: {
      message: "Sur cette page : $HIDDEN$",
      description: "Module flottant",
      placeholders: {
        hidden: {
          content: "$1"
        }
      }
    }
  };

  // extension/_locales/pt/messages.json
  var messages_default4 = {
    extDescription: {
      message: "Desfoca o ódio no X enquanto você rola a tela: racismo, ameaças, insultos. Localmente, no seu dispositivo.",
      description: "Description de la fiche"
    },
    reveal: {
      message: "Mostrar mesmo assim",
      description: "Bouton sur un tweet masqué"
    },
    rehide: {
      message: "Ocultar",
      description: "Bouton sous un tweet révélé"
    },
    rehideLabel: {
      message: "Ocultar de novo",
      description: "Libellé accessible"
    },
    notHate: {
      message: "Não é ódio",
      description: "Bouton sous un tweet révélé"
    },
    notHateTitle: {
      message: "Parar de ocultar esse tipo de mensagem",
      description: "Infobulle"
    },
    allowAccount: {
      message: "Permitir @$HANDLE$",
      description: "Bouton sous un tweet révélé",
      placeholders: {
        handle: {
          content: "$1"
        }
      }
    },
    allowAccountTitle: {
      message: "Nunca ocultar as publicações desta conta",
      description: "Infobulle"
    },
    category_racism: {
      message: "Racismo",
      description: "Filtre"
    },
    category_racism_description: {
      message: 'Insultos racistas, "volta pro teu país", xenofobia.',
      description: "Filtre"
    },
    category_hate: {
      message: "Outros ódios",
      description: "Filtre"
    },
    category_hate_description: {
      message: "Religião, homofobia e transfobia, deficiência, sexismo.",
      description: "Filtre"
    },
    category_threat: {
      message: "Ameaças",
      description: "Filtre"
    },
    category_threat_description: {
      message: "Ameaças de morte, incitação à violência.",
      description: "Filtre"
    },
    category_insult: {
      message: "Insultos",
      description: "Filtre"
    },
    category_insult_description: {
      message: "Insultos dirigidos a alguém.",
      description: "Filtre"
    },
    category_profanity: {
      message: "Palavrões",
      description: "Filtre"
    },
    category_profanity_description: {
      message: "Palavrões, mesmo sem alvo.",
      description: "Filtre"
    },
    category_custom: {
      message: "Palavra escolhida",
      description: "Motif d'un mot perso"
    },
    hudCountOne: {
      message: "$COUNT$ oculto",
      description: "Compteur",
      placeholders: {
        count: {
          content: "$1"
        }
      }
    },
    hudCountMany: {
      message: "$COUNT$ ocultos",
      description: "Compteur",
      placeholders: {
        count: {
          content: "$1"
        }
      }
    },
    hudMove: {
      message: "Setas do teclado: mover o contador",
      description: "Compteur"
    },
    popupSubtitle: {
      message: "Filtro local para o X",
      description: "Popup"
    },
    popupToggle: {
      message: "Ligar ou desligar o Voyou",
      description: "Popup"
    },
    popupOn: {
      message: "Ativado no x.com",
      description: "Popup"
    },
    popupOff: {
      message: "Desativado: nada é ocultado",
      description: "Popup"
    },
    popupNoAccess: {
      message: "Sem acesso ao x.com: nada é ocultado",
      description: "Popup"
    },
    popupGrant: {
      message: "Permitir o acesso ao x.com",
      description: "Popup"
    },
    popupGrantHint: {
      message: "Depois, recarregue suas abas do X.",
      description: "Popup"
    },
    popupHide: {
      message: "Ocultar",
      description: "Popup"
    },
    popupSensitivity: {
      message: "Sensibilidade",
      description: "Popup"
    },
    sensitivity_low: {
      message: "Flexível",
      description: "Popup"
    },
    sensitivity_medium: {
      message: "Equilibrada",
      description: "Popup"
    },
    sensitivity_high: {
      message: "Rígida",
      description: "Popup"
    },
    popupSensitivityHint: {
      message: "Rígida oculta mais mensagens, com mais erros possíveis.",
      description: "Popup"
    },
    popupCustom: {
      message: "Palavras para ocultar",
      description: "Popup"
    },
    popupCustomHint: {
      message: "Uma palavra ou expressão por linha (até $TERMS$ linhas de $LENGTH$ caracteres). Sempre ocultas, plurais em -s e -es incluídos.",
      description: "Popup",
      placeholders: {
        terms: {
          content: "$1"
        },
        length: {
          content: "$2"
        }
      }
    },
    popupAllowed: {
      message: "Contas permitidas",
      description: "Popup"
    },
    popupAllowedHint: {
      message: "Uma conta por linha. As publicações delas nunca são ocultadas.",
      description: "Popup"
    },
    popupAllowedPlaceholder: {
      message: "@conta",
      description: "Popup"
    },
    popupMuted: {
      message: "Regras ignoradas",
      description: "Popup"
    },
    popupMutedHint: {
      message: 'Desativadas com "Não é ódio".',
      description: "Popup"
    },
    popupMutedRestore: {
      message: "Reativar",
      description: "Popup"
    },
    mutedTerm: {
      message: '$CATEGORY$: "$TERM$"',
      description: "Règle ignorée : un mot",
      placeholders: {
        category: {
          content: "$1"
        },
        term: {
          content: "$2"
        }
      }
    },
    mutedPattern: {
      message: "$CATEGORY$: expressão ($LANGUAGE$)",
      description: "Règle ignorée : une tournure, et la langue de sa liste",
      placeholders: {
        category: {
          content: "$1"
        },
        language: {
          content: "$2"
        }
      }
    },
    mutedPatternAnyLanguage: {
      message: "$CATEGORY$: expressão (todos os idiomas)",
      description: "Règle ignorée : une tournure valable dans toutes les langues",
      placeholders: {
        category: {
          content: "$1"
        }
      }
    },
    popupStats: {
      message: "Últimos $DAYS$ dias",
      description: "Popup",
      placeholders: {
        days: {
          content: "$1"
        }
      }
    },
    popupStatsTotalOne: {
      message: "$COUNT$ mensagem ocultada",
      description: "Popup",
      placeholders: {
        count: {
          content: "$1"
        }
      }
    },
    popupStatsTotalMany: {
      message: "$COUNT$ mensagens ocultadas",
      description: "Popup",
      placeholders: {
        count: {
          content: "$1"
        }
      }
    },
    popupStatsEmpty: {
      message: "Nada ocultado nos últimos $DAYS$ dias.",
      description: "Popup",
      placeholders: {
        days: {
          content: "$1"
        }
      }
    },
    popupFooter: {
      message: "Tudo fica no seu dispositivo. O Voyou não denuncia nem bloqueia ninguém.",
      description: "Popup"
    },
    hudOpen: {
      message: "Abrir as configurações do Voyou",
      description: "Module flottant"
    },
    panelClose: {
      message: "Fechar",
      description: "Module flottant"
    },
    panelPage: {
      message: "Nesta página: $HIDDEN$",
      description: "Module flottant",
      placeholders: {
        hidden: {
          content: "$1"
        }
      }
    }
  };

  // extension/i18n.js
  var MESSAGES = { fr: messages_default3, en: messages_default, es: messages_default2, pt: messages_default4 };
  var FALLBACK = "en";
  function pickLocale(lang) {
    const base = (lang ?? "").toLowerCase().split(/[-_]/)[0];
    return base in MESSAGES ? (
      /** @type {Locale} */
      base
    ) : FALLBACK;
  }
  var locale = pickLocale(globalThis.navigator?.language);
  var pluralRules = new Intl.PluralRules(locale);
  function setLocale(lang) {
    locale = pickLocale(lang);
    pluralRules = new Intl.PluralRules(locale);
  }
  var getLocale = () => locale;
  function t(key, ...substitutions) {
    const entry = MESSAGES[locale][key] ?? MESSAGES.fr[key];
    if (!entry) return key;
    return entry.message.replace(/\$([A-Z_]+)\$/g, (match, name) => {
      const index = Number(entry.placeholders?.[name.toLowerCase()]?.content.slice(1)) - 1;
      return index >= 0 && index < substitutions.length ? String(substitutions[index]) : match;
    });
  }
  var plural = (key, count2) => t(`${key}${pluralRules.select(count2) === "one" ? "One" : "Many"}`, count2);
  var categoryLabel = (category) => t(`category_${category}`);

  // extension/lifecycle.js
  var stops = /* @__PURE__ */ new Set();
  function isAlive() {
    try {
      return Boolean(chrome.runtime?.id);
    } catch {
      return false;
    }
  }
  function onShutdown(stop) {
    stops.add(stop);
  }
  function guard() {
    if (isAlive()) return true;
    for (const stop of stops) stop();
    stops.clear();
    return false;
  }
  function every(ms, task) {
    const id = window.setInterval(() => guard() && task(), ms);
    onShutdown(() => window.clearInterval(id));
  }

  // extension/settings.js
  var SENSITIVITIES = ["low", "medium", "high"];
  var MAX_CUSTOM_TERMS = 200;
  var MAX_TERM_LENGTH = 60;
  var RULE_ID = /^[a-z0-9-]{1,64}$/;
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
  var listItems = (value, separator) => Array.isArray(value) ? value.filter((item) => typeof item === "string") : String(value ?? "").split(separator);
  function parseHandles(value) {
    const handles = listItems(value, /[\s,;]+/).map((h2) => h2.trim().replace(/^@/, "").toLowerCase()).filter((h2) => /^\w{1,15}$/.test(h2));
    return [...new Set(handles)];
  }
  function parseTerms(value) {
    const terms = listItems(value, /\n/).map((term) => term.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase()).filter((term) => term.length >= 2 && term.length <= MAX_TERM_LENGTH);
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
      mutedRules: Array.isArray(raw.mutedRules) ? [...new Set(raw.mutedRules.filter((id) => typeof id === "string" && RULE_ID.test(id)))] : []
    };
  }
  async function loadSettings() {
    return sanitizeSettings(await chrome.storage.local.get(DEFAULT_SETTINGS));
  }
  async function saveSettings(changes) {
    if (guard()) await chrome.storage.local.set(changes);
  }

  // extension/stats.js
  var STATS_KEY = "stats";
  var KEEP_DAYS = 30;
  var FLUSH_DELAY_MS = 2e3;
  var LOCK_NAME = "voyou-stats";
  var DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
  var dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  function dayKeyAgo(n) {
    const today = /* @__PURE__ */ new Date();
    return dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - n));
  }
  function lastDays(days) {
    const first = dayKeyAgo(days - 1);
    const last = dayKeyAgo(-1);
    return (day) => DAY_KEY.test(day) && day >= first && day <= last;
  }
  var pending = {};
  var flushTimer = 0;
  var asStats = (value) => (
    /** @type {Stats} */
    value && typeof value === "object" ? value : {}
  );
  function prune(stats) {
    const keep = lastDays(KEEP_DAYS);
    let pruned = false;
    for (const day of Object.keys(stats)) {
      if (keep(day)) continue;
      delete stats[day];
      pruned = true;
    }
    return pruned;
  }
  var update = (change) => navigator.locks.request(LOCK_NAME, async () => {
    if (!guard()) return;
    const stats = asStats((await chrome.storage.local.get(STATS_KEY))[STATS_KEY]);
    if (change(stats)) await chrome.storage.local.set({ [STATS_KEY]: stats });
  });
  function flush() {
    window.clearTimeout(flushTimer);
    flushTimer = 0;
    if (!Object.keys(pending).length || !guard()) return;
    const batch = pending;
    pending = {};
    update((stats) => {
      for (const [day, counts] of Object.entries(batch)) {
        stats[day] ??= {};
        for (const [category, n] of Object.entries(counts)) stats[day][category] = (stats[day][category] ?? 0) + n;
      }
      prune(stats);
      return true;
    });
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  function recordHidden(category) {
    const day = dayKey(/* @__PURE__ */ new Date());
    pending[day] ??= {};
    pending[day][category] = (pending[day][category] ?? 0) + 1;
    if (!flushTimer) flushTimer = window.setTimeout(flush, FLUSH_DELAY_MS);
  }
  function pruneStats() {
    return update(prune);
  }
  async function readStats(days) {
    const stats = asStats((await chrome.storage.local.get(STATS_KEY))[STATS_KEY]);
    const recent = lastDays(days);
    const byCategory = {};
    let total = 0;
    for (const [day, counts] of Object.entries(stats)) {
      if (!recent(day)) continue;
      for (const [category, n] of Object.entries(counts)) {
        byCategory[category] = (byCategory[category] ?? 0) + n;
        total += n;
      }
    }
    return { total, byCategory };
  }

  // extension/ui/panel.css
  var panel_default = '/* Panneau des réglages, injecté dans la popup et dans le Shadow DOM du compteur. */\n\n.panel {\n  --background: #fff;\n  --surface: #f4f4f5;\n  --border: #e4e4e7;\n  --border-strong: #d4d4d8;\n  --text: #18181b;\n  --text-muted: #52525b;\n  --text-faint: #71717a;\n  --accent: #27272a;\n  --accent-text: #fff;\n  --bar: #e4e4e7;\n  --focus: #2563eb;\n  --radius: 10px;\n\n  /* Cases à cocher et barres de défilement dans le thème du panneau. */\n  color-scheme: light;\n  box-sizing: border-box;\n  width: 320px;\n  padding: 14px 16px;\n  background: var(--background);\n  color: var(--text);\n  font:\n    13px/1.4 system-ui,\n    -apple-system,\n    "Segoe UI",\n    Roboto,\n    "Helvetica Neue",\n    Arial,\n    sans-serif;\n  text-align: left;\n}\n\n.panel.is-dark {\n  --background: #15171a;\n  --surface: #1f2226;\n  --border: #2f3336;\n  --border-strong: #3f4448;\n  --text: #e7e9ea;\n  --text-muted: #a1a1aa;\n  --text-faint: #8b8f96;\n  --accent: #e7e9ea;\n  --accent-text: #0f1419;\n  --bar: #33373c;\n\n  color-scheme: dark;\n}\n\n.panel *,\n.panel *::before,\n.panel *::after {\n  box-sizing: border-box;\n}\n\n.panel p {\n  margin: 0;\n}\n\n.panel__header {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n}\n\n.panel__header > div:first-child {\n  flex: 1;\n}\n\n.panel__title {\n  font-size: 16px;\n  font-weight: 700;\n  letter-spacing: -0.01em;\n}\n\n.panel__subtitle {\n  color: var(--text-faint);\n  font-size: 12px;\n}\n\n.panel__close {\n  padding: 4px 10px;\n  border: 1px solid var(--border-strong);\n  border-radius: 999px;\n  background: transparent;\n  color: var(--text-muted);\n  font: inherit;\n  font-size: 12px;\n  cursor: pointer;\n}\n\n.panel__close:hover {\n  color: var(--text);\n}\n\n.panel__state {\n  margin: 6px 0 12px !important;\n  color: var(--text-muted);\n  font-size: 12px;\n}\n\n.panel__footer {\n  margin-top: 10px !important;\n  color: var(--text-faint);\n  font-size: 11px;\n}\n\n/* Accès à x.com, quand il manque (popup seulement) */\n\n.panel__access {\n  display: grid;\n  justify-items: start;\n  gap: 6px;\n  margin: 0 0 12px;\n  padding: 10px 12px;\n  border: 1px solid var(--border-strong);\n  border-radius: var(--radius);\n}\n\n.panel__access[hidden] {\n  display: none;\n}\n\n.panel__grant {\n  padding: 6px 12px;\n  border: none;\n  border-radius: 999px;\n  background: var(--accent);\n  color: var(--accent-text);\n  font: inherit;\n  font-weight: 600;\n  cursor: pointer;\n}\n\n.section {\n  display: block;\n  margin: 0 0 12px;\n  padding: 0;\n  border: none;\n}\n\n.section[hidden] {\n  display: none;\n}\n\n.section__title {\n  display: block;\n  margin-bottom: 6px;\n  padding: 0;\n  color: var(--text-muted);\n  font-size: 11px;\n  font-weight: 600;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n}\n\n.section__hint {\n  display: block;\n  margin-top: 6px;\n  color: var(--text-faint);\n  font-size: 11px;\n}\n\n/* Infos */\n\n.stats {\n  margin: 0 0 12px;\n  padding: 10px 12px;\n  border-radius: var(--radius);\n  background: var(--surface);\n}\n\n.stats__page {\n  margin-bottom: 8px !important;\n  font-weight: 600;\n}\n\n.stats__total {\n  font-weight: 600;\n}\n\n.stats__bars {\n  display: grid;\n  gap: 4px;\n  margin: 8px 0 0;\n  padding: 0;\n  list-style: none;\n}\n\n.stats__bars:empty {\n  display: none;\n}\n\n.stats__bar {\n  display: flex;\n  justify-content: space-between;\n  padding: 2px 6px;\n  border-radius: 4px;\n  background: linear-gradient(to right, var(--bar) calc(var(--share) * 100%), transparent 0);\n  font-size: 11px;\n}\n\n/* Filtres */\n\n.toggle {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  padding: 6px 10px;\n  border: 1px solid var(--border);\n  border-radius: var(--radius);\n  cursor: pointer;\n}\n\n.toggle + .toggle {\n  margin-top: 4px;\n}\n\n.toggle__text {\n  display: flex;\n  flex-direction: column;\n}\n\n.toggle__label {\n  font-weight: 600;\n}\n\n.toggle__description {\n  color: var(--text-faint);\n  font-size: 11px;\n  line-height: 1.3;\n}\n\n.toggle__input {\n  flex-shrink: 0;\n  width: 16px;\n  height: 16px;\n  margin: 0;\n  accent-color: var(--accent);\n  cursor: pointer;\n}\n\n/* Sensibilité */\n\n.segmented {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  padding: 3px;\n  border-radius: var(--radius);\n  background: var(--surface);\n}\n\n.segmented__option {\n  position: relative;\n  padding: 6px 0;\n  border-radius: 7px;\n  color: var(--text-muted);\n  font-weight: 500;\n  text-align: center;\n  cursor: pointer;\n}\n\n.segmented__option input {\n  position: absolute;\n  opacity: 0;\n}\n\n.segmented__option:has(input:checked) {\n  background: var(--background);\n  color: var(--text);\n  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);\n}\n\n.segmented__option:has(input:focus-visible) {\n  outline: 2px solid var(--focus);\n}\n\n/* Listes saisies */\n\n.panel textarea {\n  display: block;\n  width: 100%;\n  padding: 8px 10px;\n  border: 1px solid var(--border-strong);\n  border-radius: var(--radius);\n  background: var(--background);\n  color: var(--text);\n  font:\n    12px/1.5 ui-monospace,\n    SFMono-Regular,\n    Menlo,\n    monospace;\n  resize: vertical;\n}\n\n.panel textarea:focus-visible,\n.toggle__input:focus-visible,\n.panel__close:focus-visible,\n.panel__grant:focus-visible {\n  outline: 2px solid var(--focus);\n  outline-offset: 1px;\n}\n\n/* Règles ignorées */\n\n.muted {\n  display: grid;\n  gap: 4px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.muted__item {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n  padding: 6px 10px;\n  border: 1px solid var(--border);\n  border-radius: var(--radius);\n  font-size: 12px;\n}\n\n.muted__restore {\n  flex-shrink: 0;\n  padding: 2px 8px;\n  border: 1px solid var(--border-strong);\n  border-radius: 6px;\n  background: transparent;\n  color: var(--text);\n  font: inherit;\n  cursor: pointer;\n}\n\n/* Interrupteur général : une vraie case à cocher, invisible, posée sur le dessin. */\n\n.switch {\n  position: relative;\n  flex-shrink: 0;\n  width: 44px;\n  height: 24px;\n}\n\n.switch input {\n  position: absolute;\n  z-index: 1;\n  width: 100%;\n  height: 100%;\n  margin: 0;\n  opacity: 0;\n  cursor: pointer;\n}\n\n.switch__track {\n  display: block;\n  width: 100%;\n  height: 100%;\n  border-radius: 999px;\n  background: #a1a1aa;\n  transition: background 160ms ease;\n}\n\n.switch__thumb {\n  position: absolute;\n  top: 2px;\n  left: 2px;\n  width: 20px;\n  height: 20px;\n  border-radius: 50%;\n  background: var(--background);\n  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);\n  pointer-events: none;\n  transition: transform 160ms ease;\n}\n\n.switch input:checked + .switch__track {\n  background: var(--accent);\n}\n\n.switch input:checked ~ .switch__thumb {\n  transform: translateX(20px);\n}\n\n.switch input:focus-visible + .switch__track {\n  outline: 2px solid var(--focus);\n  outline-offset: 2px;\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .switch__track,\n  .switch__thumb {\n    transition: none;\n  }\n}\n';

  // extension/ui/panel.js
  var STATS_DAYS = 7;
  var TYPING_DELAY_MS = 400;
  var X_ACCESS = { origins: ["https://x.com/*"] };
  function h(tag, { className, text, attrs } = {}, children = []) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== void 0) el.textContent = text;
    for (const [name, value] of Object.entries(attrs ?? {})) el.setAttribute(name, value);
    el.append(...children);
    return el;
  }
  function ruleLabel(id) {
    for (const [lang, list] of Object.entries(LISTS)) {
      const term = list.terms.find((e) => e.id === id);
      if (term) return t("mutedTerm", categoryLabel(term.category), term.terms[0]);
      const pattern = list.patterns.find((e) => e.id === id);
      if (!pattern) continue;
      if (lang === "multi") return t("mutedPatternAnyLanguage", categoryLabel(pattern.category));
      const language = new Intl.DisplayNames([getLocale()], { type: "language" }).of(lang) ?? lang;
      return t("mutedPattern", categoryLabel(pattern.category), language);
    }
    return id;
  }
  var hasAccess = async () => !chrome.permissions || chrome.permissions.contains(X_ACCESS);
  function bindList(input, { parse, format, saved, save }) {
    let timer = 0;
    let dirty = false;
    const show = (values) => {
      input.value = values.map(format).join("\n");
    };
    const commit = (text) => {
      const values = parse(text);
      if (values.join("\n") !== saved().join("\n")) save(values);
    };
    const flush2 = () => {
      window.clearTimeout(timer);
      if (!dirty) return;
      dirty = false;
      commit(input.value);
    };
    input.addEventListener("input", () => {
      dirty = true;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const lines = input.value.split("\n");
        const caretLine = input.value.slice(0, input.selectionStart).split("\n").length - 1;
        const unfinished = parse(lines[caretLine]).some((value) => !saved().includes(value));
        commit(unfinished ? lines.filter((_, i) => i !== caretLine).join("\n") : input.value);
      }, TYPING_DELAY_MS);
    });
    input.addEventListener("blur", () => {
      const values = dirty ? parse(input.value) : saved();
      flush2();
      show(values);
    });
    return {
      flush: flush2,
      /** Affiche les valeurs enregistrées, sauf dans le champ où l'utilisateur écrit. */
      render() {
        if (!input.matches(":focus")) show(saved());
      }
    };
  }
  async function mountPanel(root, { pageCount, onClose, dark }) {
    let settings2 = await loadSettings();
    let access = await hasAccess();
    let accessMissing = !access;
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
    const grant = h("button", { className: "panel__grant", text: t("popupGrant"), attrs: { type: "button" } });
    grant.addEventListener("click", () => chrome.permissions.request(X_ACCESS));
    const accessBox = h("div", { className: "panel__access" }, [
      grant,
      h("p", { className: "section__hint", text: t("popupGrantHint") })
    ]);
    const pageLine = h("p", { className: "stats__page" });
    const total = h("p", { className: "stats__total" });
    const bars = h("ul", { className: "stats__bars" });
    const stats = h("section", { className: "stats" }, [
      ...pageCount ? [pageLine] : [],
      h("p", { className: "section__title", text: t("popupStats", STATS_DAYS) }),
      total,
      bars
    ]);
    const filters = h("fieldset", { className: "section" }, [
      h("legend", { className: "section__title", text: t("popupHide") })
    ]);
    const categoryInputs = /* @__PURE__ */ new Map();
    for (const category of CATEGORIES) {
      const input = h("input", { className: "toggle__input", attrs: { type: "checkbox" } });
      categoryInputs.set(category.id, input);
      input.addEventListener(
        "change",
        () => saveSettings({ categories: [...categoryInputs].filter(([, box]) => box.checked).map(([id]) => id) })
      );
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
    const levelInputs = /* @__PURE__ */ new Map();
    for (const level of SENSITIVITIES) {
      const radio = h("input", { attrs: { type: "radio", name: radioName, value: level } });
      levelInputs.set(level, radio);
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
    const allowed2 = textArea("allowed", t("popupAllowedPlaceholder"));
    const textSection = (title, area, hint) => h("label", { className: "section" }, [
      h("span", { className: "section__title", text: title }),
      area,
      h("span", { className: "section__hint", text: hint })
    ]);
    const lists = [
      bindList(custom, {
        parse: parseTerms,
        format: (term) => term,
        saved: () => settings2.customTerms,
        save: (customTerms) => saveSettings({ customTerms })
      }),
      bindList(allowed2, {
        parse: parseHandles,
        format: (handle) => `@${handle}`,
        saved: () => settings2.allowedHandles,
        save: (allowedHandles) => saveSettings({ allowedHandles })
      })
    ];
    const flushLists = () => lists.forEach((list) => list.flush());
    addEventListener("pagehide", flushLists);
    const mutedList = h("ul", { className: "muted" });
    const muted = h("section", { className: "section" }, [
      h("p", { className: "section__title", text: t("popupMuted") }),
      mutedList,
      h("p", { className: "section__hint", text: t("popupMutedHint") })
    ]);
    const el = h("section", { className: "panel", attrs: { "aria-label": "Voyou" } }, [
      header,
      state,
      accessBox,
      stats,
      filters,
      sensitivity,
      textSection(t("popupCustom"), custom, t("popupCustomHint", MAX_CUSTOM_TERMS, MAX_TERM_LENGTH)),
      textSection(t("popupAllowed"), allowed2, t("popupAllowedHint")),
      muted,
      h("p", { className: "panel__footer", text: t("popupFooter") })
    ]);
    root.append(el);
    enabled.addEventListener("change", () => saveSettings({ enabled: enabled.checked }));
    function renderState() {
      enabled.checked = settings2.enabled;
      const text = !settings2.enabled ? t("popupOff") : access ? t("popupOn") : t("popupNoAccess");
      if (state.textContent !== text) state.textContent = text;
      accessBox.hidden = !accessMissing;
      grant.hidden = access;
    }
    function renderChoices() {
      for (const [id, input] of categoryInputs) input.checked = settings2.categories.includes(id);
      for (const [level, radio] of levelInputs) radio.checked = settings2.sensitivity === level;
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
          return h("li", { className: "muted__item" }, [h("span", { text: ruleLabel(id) }), restore]);
        })
      );
    }
    function render2() {
      renderState();
      renderChoices();
      renderMuted();
      for (const list of lists) list.render();
    }
    async function renderStats() {
      const recent = await readStats(STATS_DAYS);
      total.textContent = recent.total ? plural("popupStatsTotal", recent.total) : t("popupStatsEmpty", STATS_DAYS);
      const max = Math.max(1, ...Object.values(recent.byCategory));
      bars.replaceChildren(
        ...Object.entries(recent.byCategory).sort((a, b) => b[1] - a[1]).map(([category, count2]) => {
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
      if (pageCount) pageLine.textContent = t("panelPage", plural("hudCount", pageCount()));
    }
    function setDark(value) {
      el.classList.toggle("is-dark", value);
    }
    async function onStorageChange2(changes, area) {
      if (area !== "local") return;
      if (changes.stats) renderStats();
      if (!SETTING_KEYS.some((key) => key in changes)) return;
      settings2 = await loadSettings();
      render2();
    }
    chrome.storage.onChanged.addListener(onStorageChange2);
    async function onAccessChange() {
      access = await hasAccess();
      if (!access) accessMissing = true;
      renderState();
    }
    chrome.permissions?.onAdded.addListener(onAccessChange);
    chrome.permissions?.onRemoved.addListener(onAccessChange);
    function destroy() {
      flushLists();
      removeEventListener("pagehide", flushLists);
      chrome.storage.onChanged.removeListener(onStorageChange2);
      chrome.permissions?.onAdded.removeListener(onAccessChange);
      chrome.permissions?.onRemoved.removeListener(onAccessChange);
      el.remove();
    }
    setDark(dark);
    render2();
    refreshCount();
    renderStats();
    return { el, refreshCount, setDark, destroy };
  }

  // extension/content/hud.css
  var hud_default = `/* Module flottant sur X, dans un Shadow DOM : les styles de X ne l'atteignent pas. */

/* Caché tant que content.css ne l'affiche pas (#voyou-hud) : quand Firefox
   coupe l'extension, il retire cette feuille sans laisser le script retirer
   le module, qui disparaît alors avec elle. */
:host {
  all: initial;
  display: none;
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

/* Avant le panneau dans l'ordre du DOM (Tab va de la pastille au panneau),
   mais peinte au-dessus de son ombre. */
.hud__pill {
  position: relative;
  z-index: 1;
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
  /* Jamais plus large que la fenêtre (petite fenêtre, zoom fort). */
  width: min(320px, calc(100vw - 16px));
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

.hud.is-dark {
  /* Barre de défilement du panneau sombre aussi. */
  color-scheme: dark;
}

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
  var PANEL_WIDTH = 320;
  var BOUNDARY_EVENTS = [
    "keydown",
    "keyup",
    "keypress",
    "beforeinput",
    "input",
    "compositionstart",
    "compositionupdate",
    "compositionend",
    "paste",
    "copy",
    "cut"
  ];
  var host = null;
  var shadow = null;
  var hud = null;
  var pill = null;
  var label = null;
  var panelBox = null;
  var panel = null;
  var count = 0;
  var open = false;
  var mountGen = 0;
  var reopen = false;
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
    pill.setAttribute("aria-description", t("hudMove"));
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
    const right = rect.left + rect.width / 2 > innerWidth / 2;
    hud.dataset.v = up ? "up" : "down";
    hud.dataset.h = right ? "right" : "left";
    panelBox.style.maxHeight = `${Math.max(0, (up ? rect.top : innerHeight - rect.bottom) - 2 * MARGIN - 10)}px`;
    const width = Math.min(panelBox.offsetWidth || PANEL_WIDTH, innerWidth - 2 * MARGIN);
    if (right) {
      panelBox.style.left = "";
      panelBox.style.right = `${-Math.max(0, MARGIN - (rect.right - width))}px`;
    } else {
      panelBox.style.right = "";
      panelBox.style.left = `${-Math.max(0, rect.left + width - (innerWidth - MARGIN))}px`;
    }
  }
  function focusables() {
    if (!pill || !panelBox) return [];
    const list = [pill];
    if (!open) return list;
    for (const el of panelBox.querySelectorAll("button, input, select, textarea, a[href], [tabindex]")) {
      if (el instanceof HTMLElement && el.tabIndex >= 0 && !el.matches(":disabled") && el.getClientRects().length) {
        list.push(el);
      }
    }
    return list;
  }
  function openPanel(focus = true) {
    if (!panelBox || open) return;
    open = true;
    panelBox.hidden = false;
    placePanel();
    panelBox.classList.remove("is-closing");
    panelBox.classList.add("is-opening");
    render();
    if (focus) focusables()[1]?.focus({ preventScroll: true });
  }
  function closePanel(refocus = true) {
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
    if (refocus && shadow?.activeElement) pill?.focus();
  }
  function onKeydown(event) {
    if (!open) return;
    if (event.key === "Escape") {
      closePanel();
      return;
    }
    if (event.key !== "Tab") return;
    const list = focusables();
    const first = list[0];
    const last = list[list.length - 1];
    const current = shadow?.activeElement;
    if (!event.shiftKey && current === last) {
      event.preventDefault();
      first?.focus();
    } else if (event.shiftKey && current === first) {
      event.preventDefault();
      last?.focus();
    }
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
        const position = moveTo(rect.left, rect.top);
        if (guard()) chrome.storage.local.set({ [POSITION_KEY]: position });
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
      const position = moveTo(rect.left + direction[0] * step, rect.top + direction[1] * step);
      if (guard()) chrome.storage.local.set({ [POSITION_KEY]: position });
      if (open) placePanel();
    });
    document.addEventListener(
      "pointerdown",
      (event) => {
        if (open && !event.composedPath().includes(hostEl)) closePanel(false);
      },
      true
    );
    addEventListener("resize", () => {
      if (hostEl.style.left) moveTo(hostEl.getBoundingClientRect().left, hostEl.getBoundingClientRect().top);
      if (open) placePanel();
    });
  }
  async function initHud({ dark }) {
    for (const stale of document.querySelectorAll("#voyou-hud")) stale.remove();
    host = document.createElement("div");
    host.id = "voyou-hud";
    Object.assign(host.style, { position: "fixed", right: "16px", bottom: "16px", zIndex: "2147483000" });
    shadow = host.attachShadow({ mode: "closed" });
    for (const type of BOUNDARY_EVENTS) {
      shadow.addEventListener(type, (event) => {
        if (type === "keydown") onKeydown(
          /** @type {KeyboardEvent} */
          event
        );
        event.stopPropagation();
      });
    }
    const style = document.createElement("style");
    style.textContent = hud_default;
    label = document.createElement("span");
    pill = document.createElement("button");
    pill.type = "button";
    pill.className = "hud__pill";
    pill.append(dots(), label);
    panelBox = document.createElement("div");
    panelBox.className = "hud__panel";
    panelBox.id = "voyou-hud-panel";
    panelBox.hidden = true;
    pill.setAttribute("aria-controls", panelBox.id);
    hud = document.createElement("div");
    hud.className = "hud";
    hud.dataset.v = "up";
    hud.dataset.h = "right";
    hud.append(pill, panelBox);
    shadow.append(style, hud);
    (document.body ?? document.documentElement).append(host);
    const hostEl = host;
    onShutdown(() => hostEl.remove());
    await remount(dark);
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
  async function remount(dark) {
    if (!panelBox) return false;
    const gen = ++mountGen;
    panel?.destroy();
    panel = null;
    const box = document.createElement("div");
    panelBox.replaceChildren(box);
    const next = await mountPanel(box, { pageCount: () => count, onClose: () => closePanel(), dark });
    if (gen !== mountGen) {
      next.destroy();
      return false;
    }
    panel = next;
    return true;
  }
  async function rebuildHud({ dark }) {
    if (!panelBox) return;
    const wasOpen = open || reopen;
    reopen = wasOpen;
    closePanel();
    if (!await remount(dark)) return;
    reopen = false;
    render();
    if (wasOpen) openPanel(false);
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
      if (name && !name.startsWith("@")) return { name, source: a };
    }
    return null;
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
    const handle = detectLoggedInHandle();
    if (!handle || ownHandles.has(handle.toLowerCase())) return false;
    const stored = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
    const handles = mergeHandles([...Array.isArray(stored) ? stored : [], handle]);
    setOwnHandles(handles);
    await chrome.storage.local.set({ [STORAGE_KEY]: handles });
    return true;
  }
  async function initOwnHandles(onChange) {
    applyStoredHandles((await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY]);
    await refreshOwnHandles();
    const tick = () => guard() && refreshOwnHandles().then((changed) => changed && onChange());
    setTimeout(tick, 400);
    setTimeout(tick, 1500);
    every(REFRESH_MS, tick);
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
  var INERT = "data-voyou-inert";
  var UI_SELECTOR = ".voyou-overlay, .voyou-rehide";
  var COMPACT_HEIGHT = 72;
  var hiddenKeys = /* @__PURE__ */ new Set();
  var revealedKeys = /* @__PURE__ */ new Set();
  var pageKeys = /* @__PURE__ */ new Set();
  var boundElements = /* @__PURE__ */ new WeakSet();
  var authors = /* @__PURE__ */ new WeakMap();
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
  function notify() {
    for (const listener of listeners) listener(pageKeys.size);
  }
  function newPage() {
    if (!pageKeys.size) return;
    pageKeys.clear();
    notify();
  }
  var isHiddenKey = (key) => hiddenKeys.has(key);
  var isTreated = (el) => el.hasAttribute(STATE);
  var isHidden = (el) => el.getAttribute(STATE) === "hidden";
  function forgetHidden() {
    hiddenKeys.clear();
    pageKeys.clear();
    notify();
  }
  function forgetKey(key) {
    revealedKeys.delete(key);
    hiddenKeys.delete(key);
    if (pageKeys.delete(key)) notify();
  }
  function markTargets(el) {
    const hidden = el.getAttribute(STATE) === "hidden";
    for (const child of el.children) {
      if (child.matches(UI_SELECTOR)) continue;
      child.setAttribute(TARGET, "");
      if (!(child instanceof HTMLElement)) continue;
      if (hidden && !child.inert) {
        child.inert = true;
        child.setAttribute(INERT, "");
      } else if (!hidden && child.hasAttribute(INERT)) {
        child.inert = false;
        child.removeAttribute(INERT);
      }
    }
  }
  function setState(el, state) {
    const key = el.getAttribute(KEY);
    el.setAttribute(STATE, state);
    markTargets(el);
    if (!key) return;
    const sizeBefore = pageKeys.size;
    if (state === "hidden") {
      hiddenKeys.add(key);
      pageKeys.add(key);
      revealedKeys.delete(key);
    } else {
      hiddenKeys.delete(key);
      pageKeys.delete(key);
      revealedKeys.add(key);
    }
    if (pageKeys.size !== sizeBefore) notify();
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
  function ensureUi(el, withBar) {
    if (!el.querySelector(":scope > .voyou-overlay")) {
      const overlay = document.createElement("div");
      overlay.className = "voyou-overlay";
      overlay.hidden = true;
      const reason = document.createElement("p");
      reason.className = "voyou-reason";
      overlay.append(button("reveal", t("reveal"), void 0, true), reason);
      el.append(overlay);
    }
    if (withBar && !el.querySelector(":scope > .voyou-rehide")) {
      const bar = document.createElement("div");
      bar.className = "voyou-rehide";
      bar.hidden = true;
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
    const ownClick = (event) => {
      const ui = event.target instanceof Element ? event.target.closest(UI_SELECTOR) : null;
      if (!ui || ui.parentElement !== el) return null;
      event.preventDefault();
      event.stopPropagation();
      return (
        /** @type {Element} */
        event.target.closest("[data-voyou-action]")
      );
    };
    el.addEventListener("auxclick", ownClick);
    el.addEventListener("click", (event) => {
      switch (ownClick(event)?.getAttribute("data-voyou-action")) {
        case "reveal": {
          setState(el, "revealed");
          const next = el.tabIndex >= 0 ? el : el.querySelector(':scope > .voyou-rehide [data-voyou-action="rehide"]');
          if (next instanceof HTMLElement) next.focus({ preventScroll: true });
          break;
        }
        case "rehide":
          setState(el, "hidden");
          el.querySelector(":scope > .voyou-overlay button")?.focus({
            preventScroll: true
          });
          break;
        // Seul un vrai clic (souris, clavier) change un réglage, pas un clic
        // fabriqué par le JavaScript de la page.
        case "not-hate":
          if (event.isTrusted) actions.notHate(el);
          break;
        case "allow": {
          const handle = authors.get(el);
          if (handle && event.isTrusted) actions.allow(handle);
          break;
        }
      }
    });
  }
  function treat(el, key, { reason, author, post = false }) {
    if (!isTreated(el)) el.toggleAttribute(COMPACT, el.getBoundingClientRect().height < COMPACT_HEIGHT);
    el.setAttribute(KEY, key);
    if (author) authors.set(el, author);
    ensureUi(el, post || !el.hasAttribute(COMPACT));
    const reasonEl = el.querySelector(":scope > .voyou-overlay .voyou-reason");
    if (reasonEl && reasonEl.textContent !== reason) reasonEl.textContent = reason;
    const canSave = isAlive();
    const notHate = el.querySelector(':scope > .voyou-rehide [data-voyou-action="not-hate"]');
    if (notHate instanceof HTMLElement) notHate.hidden = !canSave;
    const allow = el.querySelector(':scope > .voyou-rehide [data-voyou-action="allow"]');
    if (allow instanceof HTMLElement) {
      allow.hidden = !canSave || !author;
      const label2 = author ? t("allowAccount", author) : "";
      if (allow.textContent !== label2) allow.textContent = label2;
    }
    setState(el, revealedKeys.has(key) ? "revealed" : "hidden");
  }
  function untreat(el) {
    if (!isTreated(el)) return;
    for (const ui of el.querySelectorAll(`:scope > :is(${UI_SELECTOR})`)) ui.remove();
    for (const child of el.querySelectorAll(`:scope > [${TARGET}]`)) {
      child.removeAttribute(TARGET);
      if (child.hasAttribute(INERT)) {
        child.removeAttribute("inert");
        child.removeAttribute(INERT);
      }
      if (child.getAttribute("aria-hidden") === "") child.removeAttribute("aria-hidden");
    }
    authors.delete(el);
    for (const attr of [STATE, KEY, COMPACT, "data-voyou-author"]) el.removeAttribute(attr);
  }
  function untreatAll() {
    for (const el of document.querySelectorAll(`[${STATE}]`)) {
      if (el instanceof HTMLElement) untreat(el);
    }
  }

  // extension/content/main.js
  var MAX_TEXT_LENGTH = 4e3;
  var SAFETY_RESCAN_MS = 3e3;
  var settings = sanitizeSettings({});
  var allowed = /* @__PURE__ */ new Set();
  var settingsVersion = 0;
  var scoringKey = "";
  var scannedPath = location.pathname;
  var verdicts = /* @__PURE__ */ new WeakMap();
  var applied = /* @__PURE__ */ new WeakMap();
  var counted = /* @__PURE__ */ new Set();
  function applySettings(next) {
    settings = next;
    allowed = new Set(next.allowedHandles);
    const key = JSON.stringify([next.sensitivity, next.categories, next.customTerms, next.mutedRules]);
    if (key === scoringKey) return false;
    scoringKey = key;
    settingsVersion++;
    return true;
  }
  function judge(source, text, scope = "message") {
    const cached = verdicts.get(source);
    if (cached?.text === text && cached.version === settingsVersion) return cached;
    const result = scoreText({
      text: text.slice(0, MAX_TEXT_LENGTH),
      sensitivity: settings.sensitivity,
      categories: settings.categories,
      customTerms: settings.customTerms,
      mutedRules: settings.mutedRules,
      scope
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
  function apply(el, key, verdict, author, post = false) {
    if (verdict?.category) {
      applied.set(el, verdict);
      if (!counted.has(key)) {
        counted.add(key);
        recordHidden(verdict.category);
      }
      treat(el, key, { reason: categoryLabel(verdict.category), author, post });
    } else if (isHiddenKey(key)) {
      treat(el, key, { reason: "", author, post });
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
    const displayName = kind === "tweet" && !verdict?.category ? extractDisplayName(unit) : null;
    if (displayName) {
      const byName = judge(displayName.source, displayName.name, "name");
      if (byName.category) verdict = byName;
    }
    apply(unit, key, verdict, author, kind === "tweet");
    if (!quote) return;
    if (isHidden(unit)) {
      untreat(quote);
      return;
    }
    const quoteAuthor = extractAuthor(quote);
    if (quoteAuthor && allowed.has(quoteAuthor.toLowerCase())) {
      forgetKey(`quote:${key}`);
      untreat(quote);
      return;
    }
    const quoteText = extractQuoteText(quote);
    apply(quote, `quote:${key}`, quoteText ? judge(quote, quoteText) : null, quoteAuthor, true);
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
    if (location.pathname !== scannedPath) newPage();
    scannedPath = location.pathname;
    findUnits(document).forEach(processUnit);
  }
  function isOwnMutation(mutation) {
    if (mutation.type === "attributes") {
      const state = mutation.target instanceof Element ? mutation.target.getAttribute(STATE) : null;
      return !mutation.oldValue || !state || state === mutation.oldValue;
    }
    if (mutation.type !== "childList") return false;
    return [...mutation.addedNodes, ...mutation.removedNodes].every(
      (node) => node instanceof Element && node.matches(UI_SELECTOR)
    );
  }
  function onMutations(mutations) {
    if (!settings.enabled) return;
    if (location.pathname !== scannedPath) {
      scan();
      return;
    }
    const changed = /* @__PURE__ */ new Set();
    const units = /* @__PURE__ */ new Set();
    for (const mutation of mutations) {
      if (isOwnMutation(mutation)) continue;
      const { target } = mutation;
      const el = target instanceof Element ? target : target.parentElement;
      if (el) changed.add(el);
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) for (const unit of findUnits(node)) units.add(unit);
      }
    }
    for (const el of changed) {
      const unit = unitOf(el);
      if (unit && !el.closest(UI_SELECTOR)) units.add(unit);
    }
    for (const unit of units) if (unit.isConnected) processUnit(unit);
  }
  async function onStorageChange(changes) {
    if (changes.ownHandles) {
      applyStoredHandles(changes.ownHandles.newValue);
      scan();
    }
    if (!SETTING_KEYS.some((key) => key in changes)) return;
    const wasEnabled = settings.enabled;
    const rescore = applySettings(await loadSettings());
    setHudEnabled(settings.enabled);
    if (rescore || settings.enabled !== wasEnabled) {
      forgetHidden();
      untreatAll();
    }
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
    if (!settings.enabled) return;
    const steps = warmUpSteps(settings.customTerms);
    const step = (deadline) => {
      do
        if (steps.next().done) return;
      while (deadline.timeRemaining() > 5);
      requestIdleCallback(step);
    };
    requestIdleCallback(step);
  }
  function followXLanguage() {
    const sync = async () => {
      if (!guard()) return;
      const previous = getLocale();
      setLocale(document.documentElement.lang || navigator.language);
      if (getLocale() === previous) return;
      chrome.storage.local.set({ uiLang: getLocale() });
      untreatAll();
      scan();
      await rebuildHud({ dark: document.documentElement.dataset.voyouTheme === "dark" });
    };
    setLocale(document.documentElement.lang || navigator.language);
    chrome.storage.local.set({ uiLang: getLocale() });
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    onShutdown(() => observer.disconnect());
  }
  async function start() {
    followXLanguage();
    applySettings(await loadSettings());
    pruneStats();
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local") onStorageChange(changes);
    });
    await initOwnHandles(scan);
    onHiddenCountChange(setHudCount);
    untreatAll();
    scan();
    new MutationObserver(onMutations).observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      // « Afficher quand même » et « Masquer » ne changent que cet attribut.
      attributeFilter: [STATE],
      attributeOldValue: true
    });
    window.setInterval(scan, SAFETY_RESCAN_MS);
    await initHud({ dark: document.documentElement.dataset.voyouTheme === "dark" });
    setHudEnabled(settings.enabled);
    warmUpDetector();
  }
  start();
})();
