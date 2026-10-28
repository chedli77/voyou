"use strict";
(() => {
  // extension/manifest.json
  var manifest_default = {
    manifest_version: 3,
    name: "Voyou",
    version: "0.2.2",
    description: "Masque la haine de ton feed et de tes commentaires sur X, en local sur ton appareil.",
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
    ],
    host_permissions: ["https://x.com/*", "https://twitter.com/*"]
  };

  // extension/detection/lists/blocklist.json
  var blocklist_default = {
    entries: [
      {
        id: "bl-en-nword",
        lang: "en",
        category: "racial_slur",
        weight: 0.95,
        terms: ["nigger", "niggers", "nigga", "niggas"],
        note: "Mot en n anglais et ses variantes."
      },
      {
        id: "bl-en-coon",
        lang: "en",
        category: "racial_slur",
        weight: 0.85,
        terms: ["coon", "coons"],
        note: "Insulte raciste anglaise. Le sens animal est rare sur X."
      },
      {
        id: "bl-en-spic",
        lang: "en",
        category: "ethnic_hate",
        weight: 0.85,
        terms: ["spic", "spics"],
        note: "Insulte visant les Latinos."
      },
      {
        id: "bl-en-chink",
        lang: "en",
        category: "ethnic_hate",
        weight: 0.85,
        terms: ["chink", "chinks"],
        note: "Insulte visant les Asiatiques."
      },
      {
        id: "bl-en-kike",
        lang: "en",
        category: "religious_hate",
        weight: 0.9,
        terms: ["kike", "kikes"],
        note: "Insulte antisémite."
      },
      {
        id: "bl-en-paki",
        lang: "en",
        category: "ethnic_hate",
        weight: 0.85,
        terms: ["paki", "pakis"],
        note: "Insulte visant les Pakistanais et Sud-Asiatiques."
      },
      {
        id: "bl-en-wetback",
        lang: "en",
        category: "ethnic_hate",
        weight: 0.85,
        terms: ["wetback", "wetbacks"],
        note: "Insulte visant les Mexicains et immigrés."
      },
      {
        id: "bl-en-raghead",
        lang: "en",
        category: "religious_hate",
        weight: 0.85,
        terms: ["raghead", "ragheads", "towelhead", "towelheads"],
        note: "Insulte islamophobe ou anti-arabe."
      },
      {
        id: "bl-en-dirty-arab",
        lang: "en",
        category: "ethnic_hate",
        weight: 0.8,
        terms: ["dirty arab", "dirty arabs", "you arab scum"],
        note: "Insulte ethnique en plusieurs mots."
      },
      {
        id: "bl-en-black-ape",
        lang: "en",
        category: "racial_slur",
        weight: 0.8,
        terms: ["black ape", "black apes", "you ape"],
        note: "Comparaison au singe visant les Noirs. Poids 0.8 voulu, « you ape » compris."
      },
      {
        id: "bl-fr-negre",
        lang: "fr",
        category: "racial_slur",
        weight: 0.95,
        terms: ["nègre", "nègres", "negre", "negres"],
        requireAttackCompanion: true,
        note: "Ne compte qu'avec un autre signal d'attaque : l'usage littéraire ou historique seul doit passer."
      },
      {
        id: "bl-fr-bamboula",
        lang: "fr",
        category: "racial_slur",
        weight: 0.9,
        terms: ["bamboula", "bamboulas"],
        note: "Insulte raciste."
      },
      {
        id: "bl-fr-bougnoule",
        lang: "fr",
        category: "racial_slur",
        weight: 0.95,
        terms: ["bougnoule", "bougnoules", "bougnoul"],
        note: "Insulte raciste visant les Arabes et Maghrébins."
      },
      {
        id: "bl-fr-sale-arabe",
        lang: "fr",
        category: "ethnic_hate",
        weight: 0.85,
        terms: ["sale arabe", "sales arabes", "sale maghrébin", "sale maghrebin"],
        note: "Construction « sale » + origine."
      },
      {
        id: "bl-fr-sale-noir",
        lang: "fr",
        category: "racial_slur",
        weight: 0.85,
        terms: ["sale noir", "sales noirs", "sale noire", "sales noires"],
        note: "Construction « sale » + couleur de peau."
      },
      {
        id: "bl-fr-youpin",
        lang: "fr",
        category: "religious_hate",
        weight: 0.9,
        terms: ["youpin", "youpins", "youpine"],
        note: "Insulte antisémite."
      },
      {
        id: "bl-fr-crouille",
        lang: "fr",
        category: "ethnic_hate",
        weight: 0.85,
        terms: ["crouille", "crouilles", "crouillat"],
        note: "Insulte visant les Maghrébins."
      },
      {
        id: "bl-fr-raton",
        lang: "fr",
        category: "ethnic_hate",
        weight: 0.55,
        terms: ["raton", "ratons"],
        requireAttackCompanion: true,
        note: "Ne compte qu'avec un autre signal d'attaque : « raton laveur » doit passer."
      },
      {
        id: "bl-fr-bicot",
        lang: "fr",
        category: "ethnic_hate",
        weight: 0.9,
        terms: ["bicot", "bicots"],
        note: "Insulte visant les Arabes."
      },
      {
        id: "bl-fr-negro",
        lang: "fr",
        category: "racial_slur",
        weight: 0.8,
        terms: ["négro", "négros", "negro", "negros"],
        note: "Usage haineux en français."
      },
      {
        id: "bl-any-monkey-racial",
        lang: "any",
        category: "racial_slur",
        weight: 0.55,
        terms: ["banania", "singe savant"],
        note: "Clichés coloniaux (banania, singe savant)."
      },
      {
        id: "bl-fr-gnoule",
        lang: "fr",
        category: "racial_slur",
        weight: 0.9,
        terms: ["gnoule", "gnoules"],
        note: "Forme tronquée de bougnoule, vue dans le corpus."
      },
      {
        id: "bl-fr-mongole",
        lang: "fr",
        category: "ableist_hate",
        weight: 0.7,
        terms: ["mongole", "mongoles"],
        note: "Insulte validiste. Les formes « mongole(s) » seulement, pas le peuple « Mongols »."
      },
      {
        id: "bl-fr-racaille",
        lang: "fr",
        category: "personal_insult",
        weight: 0.7,
        terms: ["racaille", "racailles"],
        note: "Insulte déshumanisante."
      },
      {
        id: "bl-fr-sale-racaille",
        lang: "fr",
        category: "personal_insult",
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
        lang: "fr",
        category: "personal_insult",
        weight: 0.8,
        terms: ["sous-merde", "sous merde", "sous merdes", "sous-merdes"],
        note: "Insulte déshumanisante."
      },
      {
        id: "bl-fr-sous-homme",
        lang: "fr",
        category: "personal_insult",
        weight: 0.85,
        terms: ["sous-homme", "sous homme", "sous-hommes", "sous hommes"],
        note: "Insulte déshumanisante."
      },
      {
        id: "bl-en-scum-attack",
        lang: "en",
        category: "personal_insult",
        weight: 0.75,
        terms: ["you scum", "piece of scum", "human scum", "worthless scum"],
        note: "Insulte anglaise en plusieurs mots, pour éviter les titres de presse."
      },
      {
        id: "bl-fr-connard",
        lang: "fr",
        category: "personal_insult",
        weight: 0.7,
        terms: ["connard", "connards", "connasse", "connasses"],
        note: "Presque toujours une insulte directe. « con » seul passe par les motifs."
      },
      {
        id: "bl-fr-abruti",
        lang: "fr",
        category: "personal_insult",
        weight: 0.65,
        terms: ["abruti", "abrutis", "abrutie", "abruties"],
        note: "Insulte directe."
      },
      {
        id: "bl-fr-tocard",
        lang: "fr",
        category: "personal_insult",
        weight: 0.75,
        terms: ["tocard", "tocards"],
        note: "Insulte."
      },
      {
        id: "bl-fr-encule",
        lang: "fr",
        category: "personal_insult",
        weight: 0.85,
        terms: ["enculé", "enculés", "encule", "encules"],
        note: "Insulte forte."
      },
      {
        id: "bl-fr-enfoire",
        lang: "fr",
        category: "personal_insult",
        weight: 0.8,
        terms: ["enfoiré", "enfoirés", "enfoire", "enfoires"],
        note: "Insulte."
      },
      {
        id: "bl-fr-salaud",
        lang: "fr",
        category: "personal_insult",
        weight: 0.8,
        terms: ["salaud", "salauds", "salope", "salopes"],
        note: "Insulte."
      },
      {
        id: "bl-fr-cretin",
        lang: "fr",
        category: "personal_insult",
        weight: 0.7,
        terms: ["crétin", "crétins", "cretin", "cretins"],
        note: "Insulte."
      },
      {
        id: "bl-fr-naze",
        lang: "fr",
        category: "personal_insult",
        weight: 0.65,
        terms: ["naze", "nazes"],
        note: "Insulte."
      },
      {
        id: "bl-fr-boloss",
        lang: "fr",
        category: "personal_insult",
        weight: 0.7,
        terms: ["boloss", "bolosses"],
        note: "Insulte."
      },
      {
        id: "bl-fr-branleur",
        lang: "fr",
        category: "personal_insult",
        weight: 0.8,
        terms: ["branleur", "branleurs", "branleuse", "branleuses"],
        note: "Insulte."
      },
      {
        id: "bl-fr-ordure-person",
        lang: "fr",
        category: "personal_insult",
        weight: 0.7,
        terms: ["ordure", "ordures"],
        note: "Poids moyen : le sens littéral (déchets) existe."
      },
      {
        id: "bl-fr-pourri",
        lang: "fr",
        category: "personal_insult",
        weight: 0.65,
        terms: ["pourri", "pourris", "pourrie", "pourries"],
        note: "Poids moyen : « système pourri » peut déclencher, le bouton Afficher reste la sortie."
      },
      {
        id: "bl-fr-debile",
        lang: "fr",
        category: "personal_insult",
        weight: 0.65,
        terms: ["débile", "débiles", "debile", "debiles"],
        note: "Insulte, souvent dans une phrase adressée."
      },
      {
        id: "bl-fr-cassos",
        lang: "fr",
        category: "personal_insult",
        weight: 0.7,
        terms: ["cassos", "cassoss"],
        note: "Argot (cas social)."
      }
    ]
  };

  // extension/detection/lists/patterns.json
  var patterns_default = {
    entries: [
      {
        id: "pat-en-go-back",
        lang: "en",
        category: "xenophobia",
        weight: 0.75,
        pattern: "go\\s+back(\\s+to)?\\s+(africa|your\\s+country|where\\s+you\\s+came\\s+from|mexico|the\\s+jungle)",
        flags: "i",
        note: "Renvoi « go back to… »."
      },
      {
        id: "pat-en-deport-all",
        lang: "en",
        category: "xenophobia",
        weight: 0.7,
        pattern: "(deport|send\\s+back)\\s+(all\\s+)?(the\\s+)?(muslims|arabs|immigrants|illegals|blacks)",
        flags: "i",
        note: "Appel à expulser un groupe entier."
      },
      {
        id: "pat-en-monkey-people",
        lang: "en",
        category: "racial_slur",
        weight: 0.7,
        pattern: "\\b(these|those|you)\\s+(people\\s+are\\s+)?(monkeys|apes|gorillas)\\b",
        flags: "i",
        note: "Singe visant des personnes, pas les animaux."
      },
      {
        id: "pat-en-banana-racial",
        lang: "en",
        category: "racial_slur",
        weight: 0.55,
        pattern: "\\b(banana\\s+for\\s+brains|throw\\s+(him|her|them)\\s+a\\s+banana)\\b",
        flags: "i",
        note: "Moquerie raciste avec la banane."
      },
      {
        id: "pat-en-muslims-terrorists",
        lang: "en",
        category: "religious_hate",
        weight: 0.7,
        pattern: "\\b(all|every)\\s+muslims?\\s+(are|is)\\s+terrorists?\\b",
        flags: "i",
        note: "Amalgame musulmans et terroristes."
      },
      {
        id: "pat-en-dirty-ethnicity",
        lang: "en",
        category: "ethnic_hate",
        weight: 0.75,
        pattern: "\\b(dirty|filthy)\\s+(arab|arabs|muslim|muslims|jew|jews|black|blacks)\\b",
        flags: "i",
        note: "« dirty » + origine."
      },
      {
        id: "pat-fr-rentrez",
        lang: "fr",
        category: "xenophobia",
        weight: 0.7,
        pattern: "\\b(rentrez|retourne[rz]?|retournez|rentre)\\s+(chez\\s+vous|dans\\s+ton\\s+pays|dans\\s+votre\\s+pays)\\b",
        flags: "i",
        note: "« Rentrez chez vous » et variantes."
      },
      {
        id: "pat-fr-dehors-etrangers",
        lang: "fr",
        category: "xenophobia",
        weight: 0.7,
        pattern: "\\b(dehors|dehors\\s+les)\\s+(étrangers|etrangers|immigrés|immigres|arabes|noirs)\\b",
        flags: "i",
        note: "Slogans d'expulsion."
      },
      {
        id: "pat-fr-sale-racial",
        lang: "fr",
        category: "racial_slur",
        weight: 0.8,
        pattern: "\\bsales?\\s+(arabe|arabes|noir|noirs|noire|noires|n[eè]gre|n[eè]gres|bougnoule|bamboula)\\b",
        flags: "i",
        note: "« sale » + origine. Recoupe la blocklist."
      },
      {
        id: "pat-fr-singe-people",
        lang: "fr",
        category: "racial_slur",
        weight: 0.7,
        pattern: "\\b(ces|les|vous\\s+[eê]tes\\s+des?)\\s+(singes|gorilles)\\b",
        flags: "i",
        note: "Singe visant un groupe de personnes. Faux positif connu : « il adore les singes »."
      },
      {
        id: "pat-fr-banane-racial",
        lang: "fr",
        category: "racial_slur",
        weight: 0.55,
        pattern: "\\b(lance[rz]?\\s+(lui|leur)\\s+une\\s+banane|mange(r)?\\s+ta\\s+banane)\\b",
        flags: "i",
        note: "Moquerie raciste avec la banane."
      },
      {
        id: "pat-fr-tous-racailles-immigres",
        lang: "fr",
        category: "xenophobia",
        weight: 0.55,
        pattern: "\\b(immigr[eé]s?|étrangers|etrangers)\\s+(c['']?est\\s+)?tous\\s+(des\\s+)?racailles\\b",
        flags: "i",
        note: "Amalgame immigrés et racailles."
      },
      {
        id: "pat-any-hang-tree",
        lang: "any",
        category: "racial_slur",
        weight: 0.85,
        pattern: "\\b(hang|lynch)\\s+(him|her|them|all)\\b.*\\b(tree|noose)\\b|\\b(arbre|potence)\\b.*\\b(pend(re|ez|ons)?)\\b",
        flags: "i",
        note: "Menace de lynchage."
      },
      {
        id: "pat-en-white-power",
        lang: "en",
        category: "racial_slur",
        weight: 0.8,
        pattern: "\\b(white\\s+power|wpww|1488)\\b",
        flags: "i",
        note: "Slogans et codes suprémacistes."
      },
      {
        id: "pat-fr-retourne-afrique",
        lang: "fr",
        category: "xenophobia",
        weight: 0.7,
        pattern: "\\b(retourne[rz]?|rentre[rz]?|rentrez|vas?)\\s+(en\\s+afrique|au\\s+maghreb|au\\s+bled|dans\\s+(ton|votre)\\s+pays|chez\\s+(toi|vous))\\b",
        flags: "i",
        note: "Renvoi vers l'Afrique, le Maghreb ou le bled. Tolère l'orthographe « vas » du corpus."
      },
      {
        id: "pat-fr-bled-merde",
        lang: "fr",
        category: "xenophobia",
        weight: 0.55,
        pattern: "\\b(bleds?|trous?)\\s+(de\\s+|à\\s+)?merde\\b",
        flags: "i",
        note: "Insulte sur le pays d'origine, souvent avec un renvoi."
      },
      {
        id: "pat-fr-babouin-people",
        lang: "fr",
        category: "racial_slur",
        weight: 0.55,
        pattern: "\\b(comme\\s+des?\\s+)?babouins?\\b",
        flags: "i",
        note: "Babouin visant des personnes."
      },
      {
        id: "pat-fr-simiesque-racial",
        lang: "fr",
        category: "racial_slur",
        weight: 0.8,
        pattern: "\\b(g[eé]n[eé]tique\\s+)?simiesques?\\b.*\\b(n[eè]gre|bougnoule|noir|arabe)|\\b(n[eè]gre|bougnoule|noir|arabe).{0,40}simiesques?\\b",
        flags: "i",
        note: "Pseudo-science raciale sur les singes."
      },
      {
        id: "pat-fr-qi-racial",
        lang: "fr",
        category: "ethnic_hate",
        weight: 0.7,
        pattern: "\\b(qi|quotient\\s+intellectuel)\\s*(faible|bas|d[eé]ficient).{0,40}(musulman|maghr[eé]bin|africain|arabe|noir)|(musulman|maghr[eé]bin|africain|arabe|noir).{0,40}(qi|quotient\\s+intellectuel)\\s*(faible|bas|d[eé]ficient)",
        flags: "i",
        note: "QI associé à un groupe. « QI » seul doit passer."
      },
      {
        id: "pat-fr-coton-expulsion",
        lang: "fr",
        category: "xenophobia",
        weight: 0.6,
        pattern: "\\b(retourne|rentre|rentrez|vas?).{0,120}champs?\\s+de\\s+coton\\b|champs?\\s+de\\s+coton.{0,120}(retourne|rentre|parasite)",
        flags: "i",
        note: "Cliché colonial du coton avec renvoi ou parasite. « coton » seul passe."
      },
      {
        id: "pat-fr-non-blancs-partent",
        lang: "fr",
        category: "xenophobia",
        weight: 0.75,
        pattern: "\\b(les\\s+)?non[-\\s]?blancs?\\s+(partent|partez|dehors|d[eé]gagent|d[eé]gagez|rentrent|rentrez)\\b|\\b(que\\s+les\\s+)?non[-\\s]?blancs?\\s+partent\\b|\\bdehors\\s+(les\\s+)?non[-\\s]?blancs?\\b",
        flags: "i",
        note: "« Que les non-blancs partent »."
      },
      {
        id: "pat-fr-group-dehors-partent",
        lang: "fr",
        category: "xenophobia",
        weight: 0.7,
        pattern: "\\b(les\\s+)?(arabes?|noirs?|musulmans?|immigr[eé]s?|maghr[eé]bins?)\\s+(dehors|partent|partez|d[eé]gage[ntz]*|rentrent)\\b|\\bdehors\\s+(les\\s+)?(arabes?|noirs?|musulmans?|immigr[eé]s?)\\b",
        flags: "i",
        note: "Arabes, Noirs ou musulmans « dehors » ou « qu'ils partent »."
      },
      {
        id: "pat-fr-death-celebration",
        lang: "fr",
        category: "targeted_cruelty",
        weight: 0.8,
        pattern: "\\b(est\\s+)?mort[es]?\\b[\\s\\S]{0,120}\\b(heureux|heureuse|heureuses|plaisir|ftg|jouissance|jouis)\\b|\\b(heureux|heureuse|plaisir|ftg|putain\\s+de\\s+plaisir)\\b[\\s\\S]{0,120}\\b(est\\s+)?mort[es]?\\b",
        flags: "i",
        note: "Mort + joie (heureux, plaisir). Les avis de décès sans joie passent."
      },
      {
        id: "pat-fr-non-blancs-expulsion",
        lang: "fr",
        category: "xenophobia",
        weight: 0.7,
        pattern: "\\b(que\\s+)?(les\\s+)?non[- ]?blancs?\\s+(partent|d[eé]gagent|se\\s+cassent|foutent\\s+le\\s+camp|d[eé]guerpissent|disparaissent)\\b|\\b(partent|d[eé]gagent|dehors)\\b.{0,40}\\bnon[- ]?blancs?\\b",
        flags: "i",
        note: "Expulsion visant les non-blancs."
      },
      {
        id: "pat-fr-voyou-attack",
        lang: "fr",
        category: "personal_insult",
        weight: 0.55,
        pattern: "\\b((c['']?est|c['']?[eé]tait|est|[eé]tait)\\s+(un\\s+|une\\s+)?|(un|une|ce|cette)\\s+|((petit[es]?|p['’]?tites?|p['’]?tit|gros+e?|grand[es]?|vrai[es]?)\\s+))voyous?\\b|\\bvoyous?\\s+(tout\\s+court|litt[eé]ralement|[eé]videmment)\\b|\\b(comportement|fin)\\s+de\\s+voyou\\b",
        flags: "i",
        note: "« voyou » seulement en attaque (c'est un voyou, petit voyou). Poids faible."
      },
      {
        id: "pat-fr-meme-communaute-dogwhistle",
        lang: "fr",
        category: "ethnic_hate",
        weight: 0.8,
        pattern: "m[eê]me\\s+communaut[eé][\\s\\S]{0,200}(viol\\w*|kalash\\w*|kalachnikov\\w*|terroris\\w*|attentat\\w*)|(viol\\w*|kalash\\w*|terroris\\w*|attentat\\w*)[\\s\\S]{0,200}m[eê]me\\s+communaut[eé]",
        flags: "iu",
        note: "Sous-entendu « même communauté » + viol, kalash ou terrorisme."
      },
      {
        id: "pat-fr-vermine-person",
        lang: "fr",
        category: "personal_insult",
        weight: 0.7,
        pattern: "\\b(sale\\s+)?vermine\\b|\\b(cette|ce|une?)\\s+vermine\\b|\\bvermine\\s+de\\b",
        flags: "i",
        note: "Personne traitée de vermine."
      },
      {
        id: "pat-fr-dechet-person",
        lang: "fr",
        category: "personal_insult",
        weight: 0.7,
        pattern: "\\b(un\\s+)?d[eé]chet\\s+en\\s+moins\\b|\\b(ce|cette|un|une)\\s+d[eé]chet\\b|\\b(sale\\s+)?d[eé]chet\\b",
        flags: "i",
        note: "Personne traitée de déchet."
      },
      {
        id: "pat-fr-racaille-framed",
        lang: "fr",
        category: "personal_insult",
        weight: 0.55,
        pattern: "(?:c['']?(?:est|[ée]tait)\\s+(?:une?\\s+)?|une?\\s+|sale\\s+|des?\\s+)racailles?\\b",
        flags: "i",
        note: "Racaille dans une phrase d'attaque."
      },
      {
        id: "pat-fr-execution-threat",
        lang: "fr",
        category: "targeted_cruelty",
        weight: 0.85,
        pattern: "(doivent\\s+[eê]tre\\s+ex[eé]cut[eé]s?|doit\\s+[eê]tre\\s+ex[eé]cut[eé]|[aà]\\s+ex[eé]cuter|il\\s+faut\\s+(les\\s+|l['']\\s*)?ex[eé]cuter|ex[eé]cutez[-\\s]?les|qu['']ils?\\s+(soient|soit)\\s+ex[eé]cut[eé]s?)",
        flags: "iu",
        note: "Menace d'exécution avec un verbe d'obligation. « ont été exécutés » dans la presse passe."
      },
      {
        id: "pat-fr-dessouder-justifie",
        lang: "fr",
        category: "targeted_cruelty",
        weight: 0.8,
        pattern: "dessoud[eé]r?[\\s\\S]{0,80}justifi[eé]e?s?|justifi[eé]e?s?[\\s\\S]{0,80}dessoud[eé]r?",
        flags: "iu",
        note: "Meurtre (dessouder) présenté comme justifié."
      },
      {
        id: "pat-fr-doivent-etre-executes",
        lang: "fr",
        category: "death_threat",
        weight: 0.9,
        pattern: "\\b(doivent|doit|devrait|devraient|il\\s+faut)\\s+(être|etre)\\s+ex[ée]cut[ée]s?\\b|\\bex[ée]cut(er|és?|ées?)\\s+(ces|les|des)\\s+\\w+\\b|\\b(pendaison|fusill(?:er|és?)|extermin(?:er|és?))\\b.{0,40}\\b(tous|tous\\s+ces|ces\\s+gens)\\b",
        flags: "i",
        note: "« doivent être exécutés »."
      },
      {
        id: "pat-fr-directed-con",
        lang: "fr",
        category: "personal_insult",
        weight: 0.6,
        pattern: "(t['']?es|tu\\s+es|t['']?as\\s+l['']air|tu\\s+dois\\s+[eê]tre|[eê]tre|es)\\s+(con|connard|connasse|abruti|abrutie|imb[eé]cile|idiot|idiote|d[eé]bile)(\\s+toi)?\\b|esp[eè]ce\\s+de\\s+(con|connard|connasse|abruti|abrutie|imb[eé]cile|idiot|idiote|d[eé]bile)\\b|comment\\s+tu\\s+dois\\s+[eê]tre\\s+(con|connard|connasse|abruti|abrutie|imb[eé]cile|idiot|idiote|d[eé]bile)(\\s+toi)?|(quel|quelle)\\s+(con|connard|connasse|abruti|abrutie|imb[eé]cile|idiot|idiote|d[eé]bile)\\b|pauvre\\s+(con|connard|connasse|abruti|abrutie|imb[eé]cile|idiot|idiote|d[eé]bile)\\b|sale\\s+(con|connard|connasse|abruti|abrutie|imb[eé]cile|idiot|idiote|d[eé]bile)\\b|toi\\s+(le|la)\\s+(con|connard|connasse|abruti|abrutie|imb[eé]cile|idiot|idiote|d[eé]bile)\\b",
        flags: "iu",
        note: "« t'es con », « tu dois être con ». « con » seul et « à contresens » passent."
      },
      {
        id: "pat-en-directed-insult",
        lang: "en",
        category: "personal_insult",
        weight: 0.6,
        pattern: "\\b(you('re|\\s+are|\\s+must\\s+be)?\\s+(such\\s+a\\s+)?(idiot|moron|dumbass|asshole)|what\\s+an\\s+(idiot|moron)|you\\s+idiot)\\b",
        flags: "i",
        note: "Insulte directe en anglais."
      },
      {
        id: "pat-fr-petit-con",
        lang: "fr",
        category: "personal_insult",
        weight: 0.7,
        pattern: "\\b(un|une|ce|cette|le|la)\\s+(p['’]?tites?|petites?|p['’]?tit|gros+e?|sales?|pauvres?|vrais?\\s+)?cons?\\b|\\b(p['’]?tit|petits?|p['’]?tites?|petites?|gros+e?|sales?|pauvres?|vrais?)\\s+cons?\\b",
        flags: "iu",
        note: "« un petit con », « p'tit con ». Jamais « con » seul."
      },
      {
        id: "pat-fr-ducon",
        lang: "fr",
        category: "personal_insult",
        weight: 0.7,
        pattern: "\\bducons?\\b",
        flags: "iu",
        note: "« ducon » comme mot entier."
      },
      {
        id: "pat-fr-putain-de-insult",
        lang: "fr",
        category: "personal_insult",
        weight: 0.75,
        pattern: "\\bputain\\s+de\\s+(tocard|encul[eé]s?|enfoir[eé]s?|salauds?|salopes?|connards?|connasses?|abrutis?|abruties?|cr[eé]tins?|d[eé]biles?|nazes?|boloss(?:es)?|branleurs?|branleuses?|ordures?|pourris?|pourries?|cassos|merdes?|cons?)\\b",
        flags: "iu",
        note: "« putain de » + insulte. « putain » seul passe."
      },
      {
        id: "pat-fr-tes-un-insult",
        lang: "fr",
        category: "personal_insult",
        weight: 0.75,
        pattern: "\\b(t['’]?es|tu\\s+es|t['’]?as\\s+l['’]?air)\\s+(vraiment\\s+)?(un|une)\\s+(putain\\s+de\\s+)?(tocard|encul[eé]s?|enfoir[eé]s?|salauds?|salopes?|connards?|connasses?|abrutis?|abruties?|cr[eé]tins?|d[eé]biles?|nazes?|boloss(?:es)?|branleurs?|branleuses?|ordures?|pourris?|pourries?|cassos|merdes?|cons?)\\b",
        flags: "iu",
        note: "« t'es un » + insulte."
      },
      {
        id: "pat-fr-espece-sale-insult",
        lang: "fr",
        category: "personal_insult",
        weight: 0.7,
        pattern: "\\b(esp[eè]ce\\s+d['’]?|sale\\s+|pauvre\\s+|gros+e?\\s+|vrai\\s+)(tocard|encul[eé]s?|enfoir[eé]s?|salauds?|salopes?|connards?|connasses?|abrutis?|abruties?|cr[eé]tins?|d[eé]biles?|nazes?|boloss(?:es)?|branleurs?|branleuses?|ordures?|pourris?|pourries?|cassos|merdes?|cons?)\\b",
        flags: "iu",
        note: "« espèce de », « sale » ou « pauvre » + insulte."
      },
      {
        id: "pat-fr-tes-insult-adj",
        lang: "fr",
        category: "personal_insult",
        weight: 0.65,
        pattern: "\\b(t['’]?es|tu\\s+es)\\s+(vraiment\\s+)?(tocard|encul[eé]s?|enfoir[eé]s?|salauds?|salopes?|connards?|connasses?|abrutis?|abruties?|cr[eé]tins?|d[eé]biles?|nazes?|boloss(?:es)?|branleurs?|branleuses?|ordures?|pourris?|pourries?|cassos|merdes?|cons?)\\b",
        flags: "iu",
        note: "« t'es pourri », « t'es naze » sans « un »."
      },
      {
        id: "pat-fr-en-moins-celebration",
        lang: "fr",
        category: "targeted_cruelty",
        weight: 0.85,
        pattern: "(?:d[eé]linquant\\w*|d[eé]chet|racaille|voyou|vermine|ordure|merde|mort\\w*|assassin\\w*|criminel\\w*).{0,80}(?:un|une)\\s+en\\s+moins|(?:un|une)\\s+en\\s+moins.{0,80}(?:dommage|bien\\s+fait|encore|enfin|bravo|tant\\s+mieux|parfait)|\\b(?:un|une)\\s+(?:d[eé]chet|d[eé]linquant\\w*|racaille|voyou|vermine|ordure)\\s+en\\s+moins\\b",
        flags: "iu",
        note: "« un en moins » pour se réjouir d'une mort."
      },
      {
        id: "pat-fr-possessive-de-merde",
        lang: "fr",
        category: "personal_insult",
        weight: 0.75,
        pattern: "\\b(ton|ta|son|sa|tes|ses|mon|ma)\\s+[\\w'-]{2,40}\\s+de\\s+merde\\b",
        flags: "iu",
        note: "« ton X de merde ». « ce film de merde » passe."
      },
      {
        id: "pat-fr-est-un-delinquant",
        lang: "fr",
        category: "personal_insult",
        weight: 0.6,
        pattern: "\\b(est|c['’]?est|[eé]tait)\\s+(bien\\s+)?(un|une)\\s+d[eé]linquant\\w*\\b",
        flags: "iu",
        note: "« c'est un délinquant » en attaque. Les titres de presse passent."
      },
      {
        id: "pat-fr-merde-de-person",
        lang: "fr",
        category: "personal_insult",
        weight: 0.75,
        pattern: "\\b(?:cette|une?|la)\\s+merde\\s+de\\s+[\\w'-]{2,40}\\b",
        flags: "iu",
        note: "« cette merde de X »."
      },
      {
        id: "pat-fr-parle-dune-merde",
        lang: "fr",
        category: "personal_insult",
        weight: 0.55,
        pattern: "\\b(?:on\\s+parle\\s+d['’]?|c['’]?est\\s+|quelle?\\s+)\\s*(?:une?\\s+)?merde\\b|\\bd['’]une\\s+merde\\b",
        flags: "iu",
        note: "Personne traitée de merde. « merde » seul passe."
      },
      {
        id: "pat-fr-retourne-ton-pays",
        lang: "fr",
        category: "xenophobia",
        weight: 0.6,
        pattern: "(?:rest(?:er|e|ez)|retourn(?:er|e|es|ez)|rentr(?:er|e|es|ez)|repart(?:ir|ez|s))\\s+(?:pas\\s+)?(?:dans|chez|au|en)\\s+(?:ton|ta|votre|vos|leur|leurs|son)\\s+(?:pays|bled|afrique|maghreb|alg[ée]rie|maroc|tunisie)",
        flags: "iu",
        note: "« retourne dans ton pays », « fallait rester dans ton pays »."
      },
      {
        id: "pat-fr-essentialism",
        lang: "fr",
        category: "ethnic_hate",
        weight: 0.65,
        pattern: "(?:sauvagerie|barbarie|violence|b[êe]tise|d[ée]linquance)\\s+(?:propre|typique|inh[ée]rente?|naturelle)s?\\s+(?:aux|des|à\\s+la\\s+race)\\s*(?:arabes|africains|noirs|musulmans|maghr[ée]bins|immigr[ée]s|n[èe]gres)?",
        flags: "iu",
        note: "Sauvagerie attribuée à une origine."
      },
      {
        id: "pat-fr-qi-faible",
        lang: "fr",
        category: "ethnic_hate",
        weight: 0.55,
        pattern: "(?:vos|leurs?|ton|votre)\\s+qis?\\s+(?:sont|est)\\s+[^.!?]{0,30}(?:faibles?|bas|catastrophiques?)",
        flags: "iu",
        note: "QI faible adressé à quelqu'un. « QI » seul passe."
      },
      {
        id: "pat-fr-insultes-fortes",
        lang: "fr",
        category: "personal_insult",
        weight: 0.5,
        pattern: "(?<![\\p{L}])(?:fdp|fils\\s+de\\s+(?:pute|chienne)|nique\\s+(?:ta|sa|vos|votre)\\s+m[èe]re|ntm|enfoir[ée]s?|encul[ée]s?|connard|connasse|salope|b[âa]tards?)(?![\\p{L}])",
        flags: "iu",
        note: "Insultes fortes (fdp, etc.)."
      },
      {
        id: "pat-fr-sale-x",
        lang: "fr",
        category: "personal_insult",
        weight: 0.55,
        pattern: "(?<![\\p{L}])sales?\\s+(?:gauchistes?|fachos?|islamo\\p{L}*|merdes?|cons?|chiens?|rats?|tra[îi]tres?|b[âa]tards?|bicots?|ritals?|ritales?|juifs?|feujs?|nègres?|negres?|blacks?|renois|rebeus?|beurs?|musulmans?|immigr[ée]s?|migrants?|colons?|wokes?)(?![\\p{L}])",
        flags: "iu",
        note: "« sale » + étiquette (gauchiste, facho…)."
      },
      {
        id: "pat-fr-deshumanisation",
        lang: "fr",
        category: "targeted_cruelty",
        weight: 0.65,
        pattern: "(?:vous\\s+[êe]tes|ce\\s+sont|c['’]est|t['’]es|tu\\s+es|ces|tous\\s+ces|esp[èe]ces?\\s+d['’e]|bande\\s+d['’e]|que\\s+des)\\s*(?:des\\s+|une?\\s+|de\\s+la\\s+|petites?\\s+)?(?:vermines?|cafards?|parasites?|rats|sous[- ]hommes?|sous[- ]race|ordures|d[ée]chets|merdes(?:\\s+pleureuses)?|animaux|singes|sauvages|chiens|porcs|crapules|raclures?)(?![\\p{L}])",
        flags: "iu",
        note: "« vous êtes des » + vermine, merdes, animaux…"
      },
      {
        id: "pat-fr-petite-merde",
        lang: "fr",
        category: "personal_insult",
        weight: 0.5,
        pattern: "(?<![\\p{L}])petites?\\s+(?:merdes?|crapules?|raclures?|baltringues?)(?![\\p{L}])",
        flags: "iu",
        note: "« petite merde »."
      },
      {
        id: "pat-fr-faut-les-tuer",
        lang: "fr",
        category: "death_threat",
        weight: 0.8,
        pattern: "(?:faut|faudrait|il\\s+faut|on\\s+devrait|qu['’]on)\\s+(?:les|tous\\s+les|le|la)\\s+(?:tuer|buter|abattre|fusiller|cramer|br[ûu]ler|gazer|exterminer|pendre|noyer|d[ée]foncer|tabasser)",
        flags: "iu",
        note: "Appel au meurtre."
      },
      {
        id: "pat-homophobe",
        lang: "any",
        category: "personal_insult",
        weight: 0.6,
        pattern: "(?<![\\p{L}])(?:p[ée]d[ée]s?|tarlouzes?|tapettes?|fiottes?|faggots?|fags?|schwuchteln?|maricones?)(?![\\p{L}])|,\\s*homo\\s*[.!?]*\\s*$",
        flags: "iu",
        note: "Insultes homophobes (FR, EN, DE, ES)."
      },
      {
        id: "pat-en-dehumanize",
        lang: "en",
        category: "targeted_cruelty",
        weight: 0.6,
        pattern: "\\b(?:these|those|you|such|the|that|filthy|dirty)\\s+(?:\\w+\\s+)?(?:scum|vermin|rats|cockroaches|savages|subhumans?|pos|pieces?\\s+of\\s+shit|animals|parasites)\\b|\\bscum\\s+like\\s+(?:that|them|you|this)\\b",
        flags: "i",
        note: "Déshumanisation en anglais (rats, scum…)."
      },
      {
        id: "pat-en-violence",
        lang: "en",
        category: "death_threat",
        weight: 0.6,
        pattern: "\\b(?:shoot(?:ing)?|kill(?:ing)?|hang(?:ing)?|gas(?:sing)?|exterminat(?:e|ing))\\s+(?:them|em|'em|these|those|all\\s+of\\s+them)(?:\\s+all)?\\b|\\bkick\\s+(?:em|'em|them)\\s+again\\b|\\bkicking\\s+the\\s+shit\\s+out\\s+of\\b|\\bbeat\\s+(?:\\w+\\s+){0,2}into\\s+submission\\b|\\bpig\\s+fat\\b|\\btaking\\s+out\\s+the\\s+(?:rubbish|trash|garbage)\\b",
        flags: "i",
        note: "Appels à la violence en anglais."
      },
      {
        id: "pat-de-hate",
        lang: "any",
        category: "targeted_cruelty",
        weight: 0.6,
        pattern: "(?<![\\p{L}])(?:abschaum|ungeziefer|kanaken?|schie(?:ß|ss)befehl|gesindel)(?![\\p{L}])|geh(?:ö|oe)ren\\s+(?:abgeschafft|vergast|erschossen|ausgerottet|aufgeh(?:ä|ae)ngt)",
        flags: "iu",
        note: "Haine en allemand, base."
      },
      {
        id: "pat-es-hate",
        lang: "any",
        category: "ethnic_hate",
        weight: 0.6,
        pattern: "(?<![\\p{L}])(?:escoria|sudacas?|moros\\s+de\\s+mierda|negros\\s+de\\s+mierda|panchitos?)(?![\\p{L}])",
        flags: "iu",
        note: "Haine en espagnol, base."
      },
      {
        id: "emo-ape-only",
        lang: "any",
        category: "racial_slur",
        weight: 0.55,
        pattern: "^(?:@\\w+\\s*)*(?:[^\\p{L}\\p{N}]|(?<![\\p{L}])(?:mdr|ptdr|lol|lmao|xd|a?ha(?:ha)+h?|a?h(?:ah)+)(?![\\p{L}]))*(?:🐒|🦍|🐵|🦧)(?:[^\\p{L}\\p{N}]|(?<![\\p{L}])(?:mdr|ptdr|lol|lmao|xd|a?ha(?:ha)+h?|a?h(?:ah)+)(?![\\p{L}]))*$",
        flags: "iu",
        note: "Réponse faite seulement d'emojis singe (avec emojis, @mentions ou mdr). 🙈🙉🙊 ne comptent pas."
      },
      {
        id: "emo-ape-directed",
        lang: "any",
        category: "racial_slur",
        weight: 0.55,
        pattern: "(?<![\\p{L}])(?:t['’]es|tu\\s+es|t['’]?[ée]tais|tu\\s+ressembles?|c['’]est\\s+toi|comme\\s+toi|toi\\s+le|esp[èe]ces?\\s+d['’e]|bande\\s+d['’e]|ta\\s+race|(?<!je\\s)(?<!on\\s)retourne\\s+(?:dans|en|chez|au)|rentre\\s+chez|d[ée]gage|you\\s+(?:are|r|look)|you['’]re|ur\\s+(?:mom|mum|mother|mama)|that['’]?s\\s+you|go\\s+back)(?![\\p{L}])[^\\n]{0,40}?(?:🐒|🦍|🐵|🦧)|(?:🐒|🦍|🐵|🦧)[^\\n]{0,30}?(?<![\\p{L}])(?:t['’]es|tu\\s+es|t['’]?[ée]tais|tu\\s+ressembles?|c['’]est\\s+toi|comme\\s+toi|toi\\s+le|esp[èe]ces?\\s+d['’e]|bande\\s+d['’e]|ta\\s+race|(?<!je\\s)(?<!on\\s)retourne\\s+(?:dans|en|chez|au)|rentre\\s+chez|d[ée]gage|you\\s+(?:are|r|look)|you['’]re|ur\\s+(?:mom|mum|mother|mama)|that['’]?s\\s+you|go\\s+back)(?![\\p{L}])|(?<![\\p{L}])sales?\\s*(?:🐒|🦍|🐵|🦧)",
        flags: "iu",
        note: "Emoji singe adressé à quelqu'un (t'es, c'est toi, sale, you are…). Le zoo sans adresse passe."
      },
      {
        id: "emo-ape-banana",
        lang: "any",
        category: "racial_slur",
        weight: 0.3,
        pattern: "(?:🐒|🦍|🐵|🦧)[^\\n]{0,20}?🍌|🍌[^\\n]{0,20}?(?:🐒|🦍|🐵|🦧)",
        flags: "u",
        note: "Singe + banane : renfort seulement, ne floute jamais seul."
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
  var BLOCKLIST = blocklist_default.entries.map((entry) => ({
    entry,
    terms: entry.terms.map((term) => ({
      term,
      exact: wordRegExp(term),
      // "salearabe" : terme en plusieurs mots écrit sans espaces, ou espacé lettre par lettre.
      glued: /\s/.test(term) ? wordRegExp(term.replace(/\s+/g, "")) : null,
      masked: maskedMatcher(term)
    }))
  }));
  var PATTERNS = patterns_default.entries.map((entry) => ({ entry, re: new RegExp(entry.pattern, entry.flags) }));
  var langMatches = (entryLang, lang) => lang === "auto" || entryLang === "any" || entryLang === lang;
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
    for (const { entry, terms } of BLOCKLIST) {
      if (!langMatches(entry.lang, lang)) continue;
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
    for (const { entry, re } of PATTERNS) {
      if (!langMatches(entry.lang, lang)) continue;
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
  function scoreText({ text, lang = "auto", sensitivity = "medium" }) {
    const hits = text.trim() ? collectHits(text, lang) : [];
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
      categories: [...new Set(hits.map((h) => h.category))],
      matches: hits.map(({ layer, id, termOrPattern, span, weight }) => ({ layer, id, termOrPattern, span, weight })),
      reasonLocal: text.trim() ? hits.map((h) => `${h.layer}:${h.id}${h.via ? `~${h.via}` : ""}`).join(", ") || "no_hit" : "empty",
      version: VERSION
    };
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
      unit.append(createControl("voyou-overlay", "reveal", "Afficher quand même", "Afficher quand même"));
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
  function treat(unit, key) {
    unit.setAttribute(KEY, key);
    ensureUi(unit);
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
  var enabled2 = true;
  var rescanTimer = 0;
  var verdicts = /* @__PURE__ */ new WeakMap();
  function processUnit(unit) {
    const key = unitKey(unit);
    if (isOwnContent(unit, extractAuthor(unit))) {
      forgetKey(key);
      untreat(unit);
      return;
    }
    if (isHiddenKey(key)) {
      treat(unit, key);
      return;
    }
    const text = extractText(unit).slice(0, MAX_TEXT_LENGTH);
    if (!text) return;
    let verdict = verdicts.get(unit);
    if (verdict?.key !== key || verdict.text !== text) {
      verdict = { key, text, hateful: scoreText({ text }).match };
      verdicts.set(unit, verdict);
    }
    if (verdict.hateful) treat(unit, key);
    else untreat(unit);
  }
  function scan() {
    if (enabled2) findUnits(document).forEach(processUnit);
  }
  function scheduleScan() {
    window.clearTimeout(rescanTimer);
    rescanTimer = window.setTimeout(scan, RESCAN_DELAY_MS);
  }
  function onMutations(mutations) {
    if (!enabled2) return;
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
  function setEnabled(on) {
    enabled2 = on;
    setHudEnabled(on);
    if (on) scan();
    else untreatAll();
  }
  async function start() {
    document.documentElement.dataset.voyou = "actif";
    const settings = await chrome.storage.local.get({ enabled: true });
    enabled2 = settings.enabled !== false;
    await initOwnHandles(scheduleScan);
    await initHud();
    setHudEnabled(enabled2);
    setHudCount(hiddenCount());
    onHiddenCountChange(setHudCount);
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.ownHandles) {
        applyStoredHandles(changes.ownHandles.newValue);
        scheduleScan();
      }
      if (changes.enabled) setEnabled(changes.enabled.newValue !== false);
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
