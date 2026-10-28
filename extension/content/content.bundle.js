"use strict";
(() => {
  // extension/detection/categories.js
  var CATEGORIES = [
    {
      id: "racism",
      label: "Racisme",
      description: "Insultes racistes, « retourne dans ton pays », xénophobie.",
      enabledByDefault: true
    },
    {
      id: "hate",
      label: "Autres haines",
      description: "Religion, homophobie et transphobie, handicap, sexisme.",
      enabledByDefault: true
    },
    {
      id: "threat",
      label: "Menaces",
      description: "Menaces de mort, appels à la violence.",
      enabledByDefault: true
    },
    {
      id: "insult",
      label: "Insultes",
      description: "Insultes adressées à quelqu'un.",
      enabledByDefault: true
    },
    {
      id: "profanity",
      label: "Vulgarité",
      description: "Jurons, même sans personne visée.",
      enabledByDefault: false
    }
  ];
  var DEFAULT_CATEGORIES = CATEGORIES.filter((c) => c.enabledByDefault).map((c) => c.id);
  var categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

  // extension/manifest.json
  var manifest_default = {
    manifest_version: 3,
    name: "Voyou",
    version: "0.3.0",
    description: "Floute la haine sur X pendant que tu scrolles : racisme, menaces, insultes. En local, sur ton appareil.",
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

  // extension/detection/lists/de.json
  var de_default = {
    terms: [],
    patterns: [
      {
        id: "pat-de-racism",
        category: "racism",
        weight: 0.8,
        pattern: "(?<![\\p{L}\\p{N}])(?:kanaken?|neger|zigeunerpack)(?![\\p{L}\\p{N}])",
        flags: "iu",
        note: "Insultes racistes."
      },
      {
        id: "pat-de-insult",
        category: "insult",
        weight: 0.6,
        pattern: "(?<![\\p{L}\\p{N}])(?:abschaum|ungeziefer|gesindel)(?![\\p{L}\\p{N}])",
        flags: "iu",
        note: "Déshumanisation."
      },
      {
        id: "pat-de-threat",
        category: "threat",
        weight: 0.8,
        pattern: "(?<![\\p{L}\\p{N}])(?:schie(?:ß|ss)befehl)(?![\\p{L}\\p{N}])|geh(?:ö|oe)ren\\s+(?:abgeschafft|vergast|erschossen|ausgerottet|aufgeh(?:ä|ae)ngt)",
        flags: "iu",
        note: "Appels à tuer."
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
        terms: [
          "maricón",
          "maricon",
          "maricones",
          "bujarra",
          "bujarras",
          "tortillera",
          "tortilleras",
          "travelo",
          "travelos",
          "joto",
          "jotos"
        ],
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
        pattern: "\\b(t['’]?es|tu\\s+es)\\s+(vraiment\\s+)?(tocard|encul[eé]s?|enfoir[eé]s?|salauds?|salopes?|connards?|connasses?|abrutis?|abruties?|cr[eé]tins?|d[eé]biles?|nazes?|boloss(?:es)?|branleurs?|branleuses?|ordures?|pourris?|pourries?|cassos|merdes?|cons?)\\b",
        flags: "iu",
        note: "« t'es pourri », « t'es naze » sans « un »."
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
        pattern: "^(?:@\\w+\\s*)*(?:[^\\p{L}\\p{N}]|(?<![\\p{L}])(?:mdr|ptdr|lol|lmao|xd|a?ha(?:ha)+h?|a?h(?:ah)+)(?![\\p{L}]))*(?:🐒|🦍|🐵|🦧)(?:[^\\p{L}\\p{N}]|(?<![\\p{L}])(?:mdr|ptdr|lol|lmao|xd|a?ha(?:ha)+h?|a?h(?:ah)+)(?![\\p{L}]))*$",
        flags: "iu",
        note: "Réponse faite seulement d'emojis singe (avec emojis, @mentions ou mdr). 🙈🙉🙊 ne comptent pas."
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

  // extension/detection/normalize.js
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
  var TOKEN_RE = /[\p{L}\p{M}\p{N}@$€!|]+/gu;
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
    const base = joinSpacedLetters(mapHomoglyphs(text.normalize("NFKC").replace(INVISIBLE, "")));
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
  var wordRegExp = (term) => new RegExp(`${BEFORE_WORD}(${escapeRegExp(term)})${AFTER_WORD}`, "iud");
  function maskedMatcher(term) {
    const chars = [...term];
    if (chars.length < 5 || /[\s'’-]/.test(term)) return null;
    const body = chars.map((c, i) => i === 0 ? escapeRegExp(c) : `(?:${escapeRegExp(c)}|[*#])`).join("");
    const re = new RegExp(`${BEFORE_WORD}${body}${AFTER_WORD}`, "iu");
    const maxMasks = Math.floor(chars.length / 3);
    return (text) => {
      const masks = re.exec(text)?.[0].match(/[*#]/g)?.length ?? 0;
      return masks >= 1 && masks <= maxMasks;
    };
  }
  var LISTS = (
    /** @type {any} */
    { fr: fr_default, en: en_default, es: es_default, pt: pt_default, de: de_default, multi: multi_default }
  );
  var TERM_RULES = Object.entries(LISTS).flatMap(
    ([lang, list]) => list.terms.map((entry) => ({
      lang,
      entry,
      terms: entry.terms.map((term) => ({
        term,
        exact: wordRegExp(term),
        // "salearabe" : terme en plusieurs mots écrit sans espaces, ou espacé lettre par lettre.
        glued: /\s/.test(term) ? wordRegExp(term.replace(/\s+/g, "")) : null,
        masked: maskedMatcher(term)
      }))
    }))
  );
  var PATTERN_RULES = Object.entries(LISTS).flatMap(
    ([lang, list]) => list.patterns.map((entry) => ({ lang, entry, re: new RegExp(entry.pattern, entry.flags) }))
  );
  var langMatches = (ruleLang, lang) => lang === "auto" || ruleLang === "multi" || ruleLang === lang;
  function findTerm(terms, text) {
    for (const t of terms) {
      const m = t.exact.exec(text);
      if (m) return { term: t.term, span: m.indices?.[1] };
    }
    for (const t of terms) {
      if (t.glued?.test(text)) return { term: t.term, via: "glued" };
    }
    if (/[*#]/.test(text)) {
      for (const t of terms) {
        if (t.masked?.(text)) return { term: t.term, via: "masked" };
      }
    }
    return null;
  }
  function matchBlocklist(text, lang) {
    const hits = [];
    for (const { lang: ruleLang, entry, terms } of TERM_RULES) {
      if (!langMatches(ruleLang, lang)) continue;
      const found = findTerm(terms, text);
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
  function collectHits(text, lang) {
    const best = /* @__PURE__ */ new Map();
    [text, ...textVariants(text)].forEach((variant, i) => {
      for (const hit of [...matchBlocklist(variant, lang), ...matchPatterns(variant, lang)]) {
        if (i > 0) {
          hit.span = void 0;
          hit.via ??= "norm";
        }
        const previous = best.get(hit.id);
        if (!previous || hit.weight > previous.weight) best.set(hit.id, hit);
      }
    });
    const hits = [...best.values()];
    const hasCompanion = hits.some((h) => !h.gated);
    return hits.filter((h) => !h.gated || hasCompanion);
  }
  function severityOf(score) {
    if (score < 0.2) return "none";
    if (score < 0.5) return "low";
    if (score < 0.75) return "medium";
    return "high";
  }
  function actionOf(score, sensitivity) {
    const t = THRESHOLDS[sensitivity] ?? THRESHOLDS.medium;
    if (score >= t.collapse) return "collapse";
    if (score >= t.blur) return "blur";
    return "pass";
  }
  function rankCategories(hits) {
    const totals = /* @__PURE__ */ new Map();
    for (const h of hits) totals.set(h.category, (totals.get(h.category) ?? 0) + h.weight);
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([category]) => category);
  }
  function scoreText({ text, lang = "auto", sensitivity = "medium", categories = DEFAULT_CATEGORIES }) {
    const enabled2 = new Set(categories);
    const hits = text.trim() ? collectHits(text, lang).filter((h) => enabled2.has(h.category)) : [];
    const score = Math.min(
      1,
      hits.reduce((sum, h) => sum + h.weight, 0)
    );
    const action = actionOf(score, sensitivity);
    return {
      match: action !== "pass",
      action,
      score: Math.round(score * 1e3) / 1e3,
      severity: severityOf(score),
      categories: rankCategories(hits),
      matches: hits.map(({ layer, id, termOrPattern, span, weight }) => ({ layer, id, termOrPattern, span, weight })),
      reasonLocal: text.trim() ? hits.map((h) => `${h.layer}:${h.id}${h.via ? `~${h.via}` : ""}`).join(", ") || "no_hit" : "empty",
      version: VERSION
    };
  }

  // extension/settings.js
  var SENSITIVITIES = [
    { id: "low", label: "Souple" },
    { id: "medium", label: "Équilibrée" },
    { id: "high", label: "Stricte" }
  ];
  var DEFAULT_SETTINGS = {
    enabled: true,
    categories: DEFAULT_CATEGORIES,
    sensitivity: "medium",
    allowedHandles: []
  };
  var SETTING_KEYS = (
    /** @type {(keyof Settings)[]} */
    Object.keys(DEFAULT_SETTINGS)
  );
  var CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));
  var SENSITIVITY_IDS = new Set(SENSITIVITIES.map((s) => s.id));
  function parseHandles(value) {
    const items = Array.isArray(value) ? value : String(value ?? "").split(/[\s,;]+/);
    const handles = items.map((h) => String(h).trim().replace(/^@/, "").toLowerCase()).filter((h) => /^\w{1,15}$/.test(h));
    return [...new Set(handles)];
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
      allowedHandles: parseHandles(raw.allowedHandles ?? [])
    };
  }
  async function loadSettings() {
    return sanitizeSettings(await chrome.storage.local.get(DEFAULT_SETTINGS));
  }

  // extension/content/hud.js
  var POSITION_KEY = "hudPosition";
  var MINIMIZED_KEY = "hudMinimized";
  var MARGIN = 8;
  var CHEVRON_DOWN = "M3 5.5 L7 9.5 L11 5.5";
  var CHEVRON_UP = "M3 8.5 L7 4.5 L11 8.5";
  var countLabel = (n) => `${n} masqué${n > 1 ? "s" : ""}`;
  var TEMPLATE = `
  <div class="voyou-hud__inner">
    <button type="button" class="voyou-hud__drag" aria-label="Déplacer le compteur Voyou" title="Déplacer">
      <svg class="voyou-hud__icon" viewBox="0 0 14 14" aria-hidden="true">
        <circle cx="4" cy="3.5" r="1.2" /><circle cx="10" cy="3.5" r="1.2" />
        <circle cx="4" cy="7" r="1.2" /><circle cx="10" cy="7" r="1.2" />
        <circle cx="4" cy="10.5" r="1.2" /><circle cx="10" cy="10.5" r="1.2" />
      </svg>
    </button>
    <p class="voyou-hud__count"></p>
    <button type="button" class="voyou-hud__minimize" aria-expanded="true" aria-label="Réduire le compteur Voyou">
      <svg class="voyou-hud__icon" viewBox="0 0 14 14" aria-hidden="true">
        <path d="${CHEVRON_DOWN}" />
      </svg>
    </button>
  </div>`;
  var hud = null;
  var enabled = true;
  var count = 0;
  function part(selector) {
    const el = hud?.querySelector(selector);
    if (!el) throw new Error(`HUD : ${selector} introuvable`);
    return el;
  }
  function render() {
    if (!hud) return;
    part(".voyou-hud__count").textContent = countLabel(count);
    hud.setAttribute("aria-label", `Voyou : ${countLabel(count)}`);
    hud.hidden = !enabled || count === 0;
  }
  function moveTo(left, top) {
    if (!hud) return { left, top };
    const rect = hud.getBoundingClientRect();
    const clamped = {
      left: Math.min(Math.max(MARGIN, left), Math.max(MARGIN, innerWidth - rect.width - MARGIN)),
      top: Math.min(Math.max(MARGIN, top), Math.max(MARGIN, innerHeight - rect.height - MARGIN))
    };
    Object.assign(hud.style, { left: `${clamped.left}px`, top: `${clamped.top}px`, right: "auto", bottom: "auto" });
    return clamped;
  }
  var savePosition = (position) => chrome.storage.local.set({ [POSITION_KEY]: position });
  function setMinimized(minimized) {
    if (!hud) return;
    hud.dataset.minimized = String(minimized);
    const button = part(".voyou-hud__minimize");
    button.setAttribute("aria-expanded", String(!minimized));
    button.setAttribute("aria-label", minimized ? "Agrandir le compteur Voyou" : "Réduire le compteur Voyou");
    part(".voyou-hud__minimize path").setAttribute("d", minimized ? CHEVRON_UP : CHEVRON_DOWN);
  }
  function enableDrag(handle) {
    let start2 = null;
    handle.addEventListener("pointerdown", (event) => {
      if (!hud || event.button !== 0) return;
      const rect = hud.getBoundingClientRect();
      start2 = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
      hud.dataset.dragging = "true";
      handle.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    handle.addEventListener("pointermove", (event) => {
      if (start2) moveTo(start2.left + event.clientX - start2.x, start2.top + event.clientY - start2.y);
    });
    const stop = () => {
      if (!start2 || !hud) return;
      start2 = null;
      delete hud.dataset.dragging;
      const rect = hud.getBoundingClientRect();
      savePosition(moveTo(rect.left, rect.top));
    };
    handle.addEventListener("pointerup", stop);
    handle.addEventListener("pointercancel", stop);
    const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    handle.addEventListener("keydown", (event) => {
      const direction = arrows[event.key];
      if (!direction || !hud) return;
      event.preventDefault();
      const step = event.shiftKey ? 20 : 8;
      const rect = hud.getBoundingClientRect();
      savePosition(moveTo(rect.left + direction[0] * step, rect.top + direction[1] * step));
    });
  }
  async function initHud() {
    hud = document.createElement("aside");
    hud.className = "voyou-hud";
    hud.setAttribute("role", "status");
    hud.setAttribute("aria-live", "polite");
    hud.innerHTML = TEMPLATE;
    hud.hidden = true;
    (document.body ?? document.documentElement).append(hud);
    enableDrag(
      /** @type {HTMLElement} */
      part(".voyou-hud__drag")
    );
    part(".voyou-hud__minimize").addEventListener("click", (event) => {
      event.stopPropagation();
      const minimized = hud?.dataset.minimized !== "true";
      setMinimized(minimized);
      chrome.storage.local.set({ [MINIMIZED_KEY]: minimized });
    });
    addEventListener("resize", () => {
      if (hud?.style.left) moveTo(hud.getBoundingClientRect().left, hud.getBoundingClientRect().top);
    });
    const saved = await chrome.storage.local.get([POSITION_KEY, MINIMIZED_KEY]);
    setMinimized(saved[MINIMIZED_KEY] === true);
    const position = (
      /** @type {{ left?: unknown, top?: unknown } | undefined} */
      saved[POSITION_KEY]
    );
    if (typeof position?.left === "number" && typeof position?.top === "number") moveTo(position.left, position.top);
    render();
  }
  function setHudCount(n) {
    count = n;
    render();
  }
  function setHudEnabled(on) {
    enabled = on;
    render();
  }

  // extension/content/x-dom.js
  var TWEET = 'article[data-testid="tweet"], article:not([data-testid])';
  var NOTIFICATION = '[data-testid="notification"]';
  var TWEET_TEXT = '[data-testid="tweetText"]';
  var XWEB_TEXT = 'div[dir="auto"]';
  var USER_NAME = '[data-testid="User-Name"]';
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
  function extractText(unit) {
    const parts = [...unit.querySelectorAll(TWEET_TEXT)].map(textOf).filter(Boolean);
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
  function extractAuthor(unit) {
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
    for (const a of unit.querySelectorAll('a[href*="/status/"]')) {
      const id = a.getAttribute("href")?.match(/\/status\/(\d+)/)?.[1];
      if (id) return `status:${id}`;
    }
    const kind = unit.matches(NOTIFICATION) ? "notif" : "weak";
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
    return el.matches(NOTIFICATION) && !el.querySelector(TWEET);
  }
  function findUnits(root) {
    const units = [];
    if (root instanceof HTMLElement && isUnit(root)) units.push(root);
    for (const el of root.querySelectorAll(`${TWEET}, ${NOTIFICATION}`)) {
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
    ownHandles = new Set(mergeHandles(handles).map((h) => h.toLowerCase()));
  }
  function detectLoggedInHandle() {
    const profileLink = document.querySelector(PROFILE_LINK);
    const fromProfileLink = handleFromHref(profileLink?.getAttribute("href") ?? null);
    if (fromProfileLink) return fromProfileLink;
    const switcher = document.querySelector(SWITCHER);
    if (switcher) {
      const label = `${switcher.textContent ?? ""} ${switcher.getAttribute("aria-label") ?? ""}`;
      const fromLabel = cleanHandle(label.match(/@(\w{1,15})/)?.[1]);
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
  var UI_SELECTOR = ".voyou-overlay, .voyou-rehide";
  var hiddenKeys = /* @__PURE__ */ new Set();
  var revealedKeys = /* @__PURE__ */ new Set();
  var boundUnits = /* @__PURE__ */ new WeakSet();
  var listeners = /* @__PURE__ */ new Set();
  function onHiddenCountChange(listener) {
    listeners.add(listener);
  }
  var hiddenCount = () => hiddenKeys.size;
  function notify() {
    for (const listener of listeners) listener(hiddenKeys.size);
  }
  var isHiddenKey = (key) => hiddenKeys.has(key);
  var isTreated = (unit) => unit.hasAttribute(STATE);
  function forgetHidden() {
    hiddenKeys.clear();
    notify();
  }
  function forgetKey(key) {
    revealedKeys.delete(key);
    if (hiddenKeys.delete(key)) notify();
  }
  function markTargets(unit) {
    const hidden = unit.getAttribute(STATE) === "hidden";
    for (const child of unit.children) {
      if (child.matches(UI_SELECTOR)) continue;
      child.setAttribute(TARGET, "");
      child.toggleAttribute("aria-hidden", hidden);
    }
  }
  function setState(unit, state) {
    const key = unit.getAttribute(KEY);
    unit.setAttribute(STATE, state);
    markTargets(unit);
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
  function createControl(className, action, label, ariaLabel) {
    const wrapper = document.createElement("div");
    wrapper.className = className;
    const button = document.createElement("button");
    button.type = "button";
    button.className = action === "reveal" ? "voyou-btn" : "voyou-btn voyou-btn--ghost";
    button.dataset.voyouAction = action;
    button.textContent = label;
    button.setAttribute("aria-label", ariaLabel);
    wrapper.append(button);
    return wrapper;
  }
  function ensureUi(unit) {
    if (!unit.querySelector(":scope > .voyou-overlay")) {
      const overlay = createControl("voyou-overlay", "reveal", "Afficher quand même", "Afficher quand même");
      const reason = document.createElement("p");
      reason.className = "voyou-reason";
      overlay.append(reason);
      unit.append(overlay);
    }
    if (!unit.querySelector(":scope > .voyou-rehide")) {
      unit.append(createControl("voyou-rehide", "rehide", "Masquer", "Masquer à nouveau"));
    }
    if (boundUnits.has(unit)) return;
    boundUnits.add(unit);
    unit.addEventListener("click", (event) => {
      const button = event.target instanceof Element ? event.target.closest("[data-voyou-action]") : null;
      if (!button || !unit.contains(button)) return;
      event.preventDefault();
      event.stopPropagation();
      if (button.getAttribute("data-voyou-action") === "reveal") {
        setState(unit, "revealed");
      } else {
        setState(unit, "hidden");
        unit.querySelector(":scope > .voyou-overlay button")?.focus();
      }
    });
  }
  function treat(unit, key, reason) {
    unit.setAttribute(KEY, key);
    ensureUi(unit);
    const reasonEl = unit.querySelector(":scope > .voyou-overlay .voyou-reason");
    if (reasonEl && reasonEl.textContent !== reason) reasonEl.textContent = reason;
    setState(unit, revealedKeys.has(key) ? "revealed" : "hidden");
  }
  function untreat(unit) {
    if (!isTreated(unit)) return;
    for (const el of unit.querySelectorAll(`:scope > :is(${UI_SELECTOR})`)) el.remove();
    for (const child of unit.querySelectorAll(`:scope > [${TARGET}]`)) {
      child.removeAttribute(TARGET);
      child.removeAttribute("aria-hidden");
    }
    unit.removeAttribute(STATE);
    unit.removeAttribute(KEY);
  }
  function untreatAll() {
    for (const unit of document.querySelectorAll(`[${STATE}]`)) {
      if (unit instanceof HTMLElement) untreat(unit);
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
  function applySettings(next) {
    settings = next;
    allowed = new Set(next.allowedHandles);
    settingsVersion++;
  }
  function processUnit(unit) {
    const key = unitKey(unit);
    const author = extractAuthor(unit);
    if (isOwnContent(unit, author) || author && allowed.has(author.toLowerCase())) {
      forgetKey(key);
      untreat(unit);
      return;
    }
    const text = extractText(unit).slice(0, MAX_TEXT_LENGTH);
    if (!text) return;
    let verdict = verdicts.get(unit);
    if (verdict?.key !== key || verdict.text !== text || verdict.version !== settingsVersion) {
      const result = scoreText({ text, sensitivity: settings.sensitivity, categories: settings.categories });
      verdict = {
        key,
        text,
        version: settingsVersion,
        reason: result.match ? categoryLabel(result.categories[0]) : null
      };
      verdicts.set(unit, verdict);
    }
    if (verdict.reason) treat(unit, key, verdict.reason);
    else if (isHiddenKey(key)) treat(unit, key, "");
    else untreat(unit);
  }
  function scan() {
    if (settings.enabled) findUnits(document).forEach(processUnit);
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
        if (parent && isTreated(parent)) processUnit(parent);
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
  async function start() {
    document.documentElement.dataset.voyou = "actif";
    applySettings(await loadSettings());
    await initOwnHandles(scheduleScan);
    await initHud();
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
