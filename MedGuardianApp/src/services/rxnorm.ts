/**
 * Drug and allergy autocomplete using NLM Clinical Tables API (prefix search)
 * and RxNorm spelling suggestions (fuzzy/typo handling).
 * Both are public NIH APIs — no key required.
 */

/** Strip form info like "(Oral Pill)" and title-case ALL CAPS names */
function cleanDrugName(display: string): string {
  let name = display.replace(/\s*\(.*?\)\s*$/, '').trim();
  // API returns brand names in ALL CAPS (e.g. "TYLENOL") — convert to Title Case
  if (name === name.toUpperCase() && name.length > 1) {
    name = name.split(/[\s-]+/).map((w) => {
      if (w.length <= 2) return w; // keep "XR", "XL", "CR" etc uppercase
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
  }
  return name;
}

/** Common brand name → generic name mapping for instant local matching */
const BRAND_TO_GENERIC: Record<string, string> = {
  // ── Pain / Fever / Anti-inflammatory ──────────────────────────
  'tylenol': 'Acetaminophen',
  'advil': 'Ibuprofen',
  'motrin': 'Ibuprofen',
  'aleve': 'Naproxen',
  'naprosyn': 'Naproxen',
  'celebrex': 'Celecoxib',
  'mobic': 'Meloxicam',
  'voltaren': 'Diclofenac',
  'toradol': 'Ketorolac',
  'indocin': 'Indomethacin',
  'feldene': 'Piroxicam',
  'relafen': 'Nabumetone',
  'daypro': 'Oxaprozin',
  'excedrin': 'Acetaminophen/Aspirin/Caffeine',

  // ── Opioid Pain ──────────────────────────────────────────────
  'vicodin': 'Hydrocodone/Acetaminophen',
  'norco': 'Hydrocodone/Acetaminophen',
  'lortab': 'Hydrocodone/Acetaminophen',
  'percocet': 'Oxycodone/Acetaminophen',
  'oxycontin': 'Oxycodone',
  'roxicodone': 'Oxycodone',
  'dilaudid': 'Hydromorphone',
  'opana': 'Oxymorphone',
  'morphabond': 'Morphine',
  'ms contin': 'Morphine',
  'duragesic': 'Fentanyl',
  'ultram': 'Tramadol',
  'nucynta': 'Tapentadol',
  'demerol': 'Meperidine',
  'suboxone': 'Buprenorphine/Naloxone',
  'subutex': 'Buprenorphine',
  'methadose': 'Methadone',
  'narcan': 'Naloxone',

  // ── Cardiovascular — Statins ──────────────────────────────────
  'lipitor': 'Atorvastatin',
  'crestor': 'Rosuvastatin',
  'zocor': 'Simvastatin',
  'pravachol': 'Pravastatin',
  'lescol': 'Fluvastatin',
  'livalo': 'Pitavastatin',
  'mevacor': 'Lovastatin',
  'altoprev': 'Lovastatin',
  'zetia': 'Ezetimibe',
  'vytorin': 'Ezetimibe/Simvastatin',
  'repatha': 'Evolocumab',
  'praluent': 'Alirocumab',
  'nexletol': 'Bempedoic Acid',
  'tricor': 'Fenofibrate',
  'lopid': 'Gemfibrozil',
  'niaspan': 'Niacin',
  'lovaza': 'Omega-3 Fatty Acids',
  'vascepa': 'Icosapent Ethyl',

  // ── Cardiovascular — Blood Pressure ───────────────────────────
  'norvasc': 'Amlodipine',
  'prinivil': 'Lisinopril',
  'zestril': 'Lisinopril',
  'altace': 'Ramipril',
  'vasotec': 'Enalapril',
  'lotensin': 'Benazepril',
  'accupril': 'Quinapril',
  'mavik': 'Trandolapril',
  'monopril': 'Fosinopril',
  'capoten': 'Captopril',
  'diovan': 'Valsartan',
  'cozaar': 'Losartan',
  'hyzaar': 'Losartan/HCTZ',
  'benicar': 'Olmesartan',
  'atacand': 'Candesartan',
  'avapro': 'Irbesartan',
  'micardis': 'Telmisartan',
  'teveten': 'Eprosartan',
  'entresto': 'Sacubitril/Valsartan',
  'toprol': 'Metoprolol',
  'lopressor': 'Metoprolol',
  'tenormin': 'Atenolol',
  'coreg': 'Carvedilol',
  'bystolic': 'Nebivolol',
  'zebeta': 'Bisoprolol',
  'inderal': 'Propranolol',
  'innopran': 'Propranolol',
  'sectral': 'Acebutolol',
  'trandate': 'Labetalol',
  'cardizem': 'Diltiazem',
  'tiazac': 'Diltiazem',
  'calan': 'Verapamil',
  'verelan': 'Verapamil',
  'procardia': 'Nifedipine',
  'adalat': 'Nifedipine',
  'plendil': 'Felodipine',
  'sular': 'Nisoldipine',
  'catapres': 'Clonidine',
  'minipress': 'Prazosin',
  'cardura': 'Doxazosin',
  'hytrin': 'Terazosin',
  'aldomet': 'Methyldopa',
  'apresoline': 'Hydralazine',

  // ── Cardiovascular — Diuretics ────────────────────────────────
  'lasix': 'Furosemide',
  'bumex': 'Bumetanide',
  'demadex': 'Torsemide',
  'hydrodiuril': 'Hydrochlorothiazide',
  'microzide': 'Hydrochlorothiazide',
  'aldactone': 'Spironolactone',
  'inspra': 'Eplerenone',
  'dyazide': 'Triamterene/HCTZ',
  'maxzide': 'Triamterene/HCTZ',
  'midamor': 'Amiloride',
  'zaroxolyn': 'Metolazone',
  'lozol': 'Indapamide',
  'edecrin': 'Ethacrynic Acid',
  'thalitone': 'Chlorthalidone',

  // ── Cardiovascular — Antiarrhythmics / Other ──────────────────
  'coumadin': 'Warfarin',
  'plavix': 'Clopidogrel',
  'eliquis': 'Apixaban',
  'xarelto': 'Rivaroxaban',
  'pradaxa': 'Dabigatran',
  'savaysa': 'Edoxaban',
  'brilinta': 'Ticagrelor',
  'effient': 'Prasugrel',
  'aggrenox': 'Aspirin/Dipyridamole',
  'persantine': 'Dipyridamole',
  'lovenox': 'Enoxaparin',
  'fragmin': 'Dalteparin',
  'arixtra': 'Fondaparinux',
  'cordarone': 'Amiodarone',
  'pacerone': 'Amiodarone',
  'multaq': 'Dronedarone',
  'tikosyn': 'Dofetilide',
  'rythmol': 'Propafenone',
  'tambocor': 'Flecainide',
  'norpace': 'Disopyramide',
  'lanoxin': 'Digoxin',
  'digitek': 'Digoxin',
  'ranexa': 'Ranolazine',
  'nitrostat': 'Nitroglycerin',
  'imdur': 'Isosorbide Mononitrate',
  'isordil': 'Isosorbide Dinitrate',
  'bidil': 'Hydralazine/Isosorbide Dinitrate',

  // ── Diabetes ──────────────────────────────────────────────────
  'glucophage': 'Metformin',
  'fortamet': 'Metformin',
  'glumetza': 'Metformin',
  'riomet': 'Metformin',
  'januvia': 'Sitagliptin',
  'janumet': 'Sitagliptin/Metformin',
  'jardiance': 'Empagliflozin',
  'synjardy': 'Empagliflozin/Metformin',
  'farxiga': 'Dapagliflozin',
  'invokana': 'Canagliflozin',
  'steglatro': 'Ertugliflozin',
  'ozempic': 'Semaglutide',
  'wegovy': 'Semaglutide',
  'rybelsus': 'Semaglutide',
  'trulicity': 'Dulaglutide',
  'victoza': 'Liraglutide',
  'saxenda': 'Liraglutide',
  'mounjaro': 'Tirzepatide',
  'zepbound': 'Tirzepatide',
  'byetta': 'Exenatide',
  'bydureon': 'Exenatide',
  'tradjenta': 'Linagliptin',
  'onglyza': 'Saxagliptin',
  'nesina': 'Alogliptin',
  'actos': 'Pioglitazone',
  'avandia': 'Rosiglitazone',
  'amaryl': 'Glimepiride',
  'glynase': 'Glyburide',
  'diabeta': 'Glyburide',
  'micronase': 'Glyburide',
  'glucotrol': 'Glipizide',
  'precose': 'Acarbose',
  'glyset': 'Miglitol',
  'starlix': 'Nateglinide',
  'prandin': 'Repaglinide',
  'lantus': 'Insulin Glargine',
  'basaglar': 'Insulin Glargine',
  'toujeo': 'Insulin Glargine',
  'levemir': 'Insulin Detemir',
  'tresiba': 'Insulin Degludec',
  'humalog': 'Insulin Lispro',
  'novolog': 'Insulin Aspart',
  'apidra': 'Insulin Glulisine',
  'humulin': 'Insulin (Human)',
  'novolin': 'Insulin (Human)',

  // ── Thyroid ───────────────────────────────────────────────────
  'synthroid': 'Levothyroxine',
  'levoxyl': 'Levothyroxine',
  'tirosint': 'Levothyroxine',
  'unithroid': 'Levothyroxine',
  'euthyrox': 'Levothyroxine',
  'armour thyroid': 'Thyroid Desiccated',
  'nature-throid': 'Thyroid Desiccated',
  'cytomel': 'Liothyronine',
  'tapazole': 'Methimazole',

  // ── Gastrointestinal ──────────────────────────────────────────
  'nexium': 'Esomeprazole',
  'prilosec': 'Omeprazole',
  'protonix': 'Pantoprazole',
  'prevacid': 'Lansoprazole',
  'dexilant': 'Dexlansoprazole',
  'aciphex': 'Rabeprazole',
  'pepcid': 'Famotidine',
  'zantac': 'Ranitidine',
  'tagamet': 'Cimetidine',
  'carafate': 'Sucralfate',
  'reglan': 'Metoclopramide',
  'zofran': 'Ondansetron',
  'phenergan': 'Promethazine',
  'compazine': 'Prochlorperazine',
  'imodium': 'Loperamide',
  'lomotil': 'Diphenoxylate/Atropine',
  'miralax': 'Polyethylene Glycol',
  'dulcolax': 'Bisacodyl',
  'colace': 'Docusate Sodium',
  'metamucil': 'Psyllium',
  'linzess': 'Linaclotide',
  'amitiza': 'Lubiprostone',
  'trulance': 'Plecanatide',
  'xifaxan': 'Rifaximin',
  'bentyl': 'Dicyclomine',
  'levsin': 'Hyoscyamine',
  'donnatal': 'Belladonna/Phenobarbital',
  'asacol': 'Mesalamine',
  'lialda': 'Mesalamine',
  'pentasa': 'Mesalamine',
  'azulfidine': 'Sulfasalazine',

  // ── Mental Health — Antidepressants ────────────────────────────
  'zoloft': 'Sertraline',
  'lexapro': 'Escitalopram',
  'prozac': 'Fluoxetine',
  'cymbalta': 'Duloxetine',
  'paxil': 'Paroxetine',
  'celexa': 'Citalopram',
  'luvox': 'Fluvoxamine',
  'viibryd': 'Vilazodone',
  'trintellix': 'Vortioxetine',
  'effexor': 'Venlafaxine',
  'pristiq': 'Desvenlafaxine',
  'savella': 'Milnacipran',
  'wellbutrin': 'Bupropion',
  'zyban': 'Bupropion',
  'remeron': 'Mirtazapine',
  'desyrel': 'Trazodone',
  'oleptro': 'Trazodone',
  'elavil': 'Amitriptyline',
  'pamelor': 'Nortriptyline',
  'tofranil': 'Imipramine',
  'anafranil': 'Clomipramine',
  'sinequan': 'Doxepin',
  'nardil': 'Phenelzine',
  'parnate': 'Tranylcypromine',
  'marplan': 'Isocarboxazid',
  'spravato': 'Esketamine',

  // ── Mental Health — Anxiety / Sedatives / Sleep ────────────────
  'xanax': 'Alprazolam',
  'valium': 'Diazepam',
  'ativan': 'Lorazepam',
  'klonopin': 'Clonazepam',
  'librium': 'Chlordiazepoxide',
  'serax': 'Oxazepam',
  'restoril': 'Temazepam',
  'halcion': 'Triazolam',
  'tranxene': 'Clorazepate',
  'ambien': 'Zolpidem',
  'lunesta': 'Eszopiclone',
  'sonata': 'Zaleplon',
  'silenor': 'Doxepin',
  'rozerem': 'Ramelteon',
  'belsomra': 'Suvorexant',
  'quviviq': 'Daridorexant',
  'buspar': 'Buspirone',
  'vistaril': 'Hydroxyzine',
  'atarax': 'Hydroxyzine',

  // ── Mental Health — Antipsychotics ─────────────────────────────
  'abilify': 'Aripiprazole',
  'seroquel': 'Quetiapine',
  'zyprexa': 'Olanzapine',
  'risperdal': 'Risperidone',
  'invega': 'Paliperidone',
  'latuda': 'Lurasidone',
  'geodon': 'Ziprasidone',
  'vraylar': 'Cariprazine',
  'rexulti': 'Brexpiprazole',
  'clozaril': 'Clozapine',
  'haldol': 'Haloperidol',
  'thorazine': 'Chlorpromazine',
  'prolixin': 'Fluphenazine',
  'navane': 'Thiothixene',
  'loxitane': 'Loxapine',
  'saphris': 'Asenapine',
  'fanapt': 'Iloperidone',
  'caplyta': 'Lumateperone',

  // ── Mental Health — Mood Stabilizers ───────────────────────────
  'lithobid': 'Lithium',
  'eskalith': 'Lithium',
  'depakote': 'Divalproex/Valproic Acid',
  'depakene': 'Valproic Acid',
  'lamictal': 'Lamotrigine',
  'tegretol': 'Carbamazepine',
  'equetro': 'Carbamazepine',
  'trileptal': 'Oxcarbazepine',

  // ── Mental Health — ADHD ──────────────────────────────────────
  'adderall': 'Amphetamine/Dextroamphetamine',
  'vyvanse': 'Lisdexamfetamine',
  'dexedrine': 'Dextroamphetamine',
  'concerta': 'Methylphenidate',
  'ritalin': 'Methylphenidate',
  'focalin': 'Dexmethylphenidate',
  'daytrana': 'Methylphenidate',
  'strattera': 'Atomoxetine',
  'intuniv': 'Guanfacine',
  'kapvay': 'Clonidine',
  'qelbree': 'Viloxazine',

  // ── Seizure / Epilepsy ────────────────────────────────────────
  'lyrica': 'Pregabalin',
  'neurontin': 'Gabapentin',
  'gralise': 'Gabapentin',
  'dilantin': 'Phenytoin',
  'phenytek': 'Phenytoin',
  'keppra': 'Levetiracetam',
  'topamax': 'Topiramate',
  'zonegran': 'Zonisamide',
  'zarontin': 'Ethosuximide',
  'gabitril': 'Tiagabine',
  'vimpat': 'Lacosamide',
  'fycompa': 'Perampanel',
  'briviact': 'Brivaracetam',
  'banzel': 'Rufinamide',
  'aptiom': 'Eslicarbazepine',
  'onfi': 'Clobazam',
  'sabril': 'Vigabatrin',
  'mysoline': 'Primidone',
  'luminal': 'Phenobarbital',
  'epidiolex': 'Cannabidiol',

  // ── Respiratory — Asthma / COPD ───────────────────────────────
  'singulair': 'Montelukast',
  'ventolin': 'Albuterol',
  'proair': 'Albuterol',
  'proventil': 'Albuterol',
  'xopenex': 'Levalbuterol',
  'flovent': 'Fluticasone',
  'flonase': 'Fluticasone',
  'advair': 'Fluticasone/Salmeterol',
  'breo': 'Fluticasone/Vilanterol',
  'symbicort': 'Budesonide/Formoterol',
  'pulmicort': 'Budesonide',
  'rhinocort': 'Budesonide',
  'qvar': 'Beclomethasone',
  'alvesco': 'Ciclesonide',
  'asmanex': 'Mometasone',
  'nasonex': 'Mometasone',
  'serevent': 'Salmeterol',
  'foradil': 'Formoterol',
  'spiriva': 'Tiotropium',
  'atrovent': 'Ipratropium',
  'combivent': 'Ipratropium/Albuterol',
  'duoneb': 'Ipratropium/Albuterol',
  'trelegy': 'Fluticasone/Umeclidinium/Vilanterol',
  'breztri': 'Budesonide/Glycopyrrolate/Formoterol',
  'anoro': 'Umeclidinium/Vilanterol',
  'stiolto': 'Tiotropium/Olodaterol',
  'incruse': 'Umeclidinium',
  'tudorza': 'Aclidinium',
  'daliresp': 'Roflumilast',
  'theochron': 'Theophylline',
  'theo-24': 'Theophylline',
  'xolair': 'Omalizumab',
  'nucala': 'Mepolizumab',
  'dupixent': 'Dupilumab',
  'fasenra': 'Benralizumab',
  'tezspire': 'Tezepelumab',

  // ── Allergy / Antihistamines ──────────────────────────────────
  'zyrtec': 'Cetirizine',
  'claritin': 'Loratadine',
  'clarinex': 'Desloratadine',
  'allegra': 'Fexofenadine',
  'benadryl': 'Diphenhydramine',
  'unisom': 'Doxylamine',
  'dramamine': 'Dimenhydrinate',
  'astelin': 'Azelastine',
  'patanase': 'Olopatadine',
  'cromolyn': 'Cromolyn Sodium',

  // ── Antibiotics ───────────────────────────────────────────────
  'augmentin': 'Amoxicillin/Clavulanate',
  'amoxil': 'Amoxicillin',
  'keflex': 'Cephalexin',
  'ceftin': 'Cefuroxime',
  'suprax': 'Cefixime',
  'omnicef': 'Cefdinir',
  'rocephin': 'Ceftriaxone',
  'fortaz': 'Ceftazidime',
  'maxipime': 'Cefepime',
  'cipro': 'Ciprofloxacin',
  'levaquin': 'Levofloxacin',
  'avelox': 'Moxifloxacin',
  'zithromax': 'Azithromycin',
  'z-pack': 'Azithromycin',
  'biaxin': 'Clarithromycin',
  'ery-tab': 'Erythromycin',
  'erythrocin': 'Erythromycin',
  'bactrim': 'Sulfamethoxazole/Trimethoprim',
  'septra': 'Sulfamethoxazole/Trimethoprim',
  'macrobid': 'Nitrofurantoin',
  'macrodantin': 'Nitrofurantoin',
  'flagyl': 'Metronidazole',
  'cleocin': 'Clindamycin',
  'vibramycin': 'Doxycycline',
  'doryx': 'Doxycycline',
  'minocin': 'Minocycline',
  'sumycin': 'Tetracycline',
  'zyvox': 'Linezolid',
  'vancocin': 'Vancomycin',
  'tygacil': 'Tigecycline',
  'cubicin': 'Daptomycin',
  'invanz': 'Ertapenem',
  'merrem': 'Meropenem',

  // ── Antifungals ───────────────────────────────────────────────
  'diflucan': 'Fluconazole',
  'nizoral': 'Ketoconazole',
  'sporanox': 'Itraconazole',
  'lamisil': 'Terbinafine',
  'nystatin': 'Nystatin',
  'lotrimin': 'Clotrimazole',
  'monistat': 'Miconazole',

  // ── Antivirals ────────────────────────────────────────────────
  'valtrex': 'Valacyclovir',
  'zovirax': 'Acyclovir',
  'famvir': 'Famciclovir',
  'tamiflu': 'Oseltamivir',
  'xofluza': 'Baloxavir',
  'paxlovid': 'Nirmatrelvir/Ritonavir',
  'truvada': 'Emtricitabine/Tenofovir',
  'descovy': 'Emtricitabine/Tenofovir Alafenamide',
  'biktarvy': 'Bictegravir/Emtricitabine/Tenofovir Alafenamide',
  'triumeq': 'Dolutegravir/Abacavir/Lamivudine',
  'epivir': 'Lamivudine',
  'harvoni': 'Ledipasvir/Sofosbuvir',
  'sovaldi': 'Sofosbuvir',
  'mavyret': 'Glecaprevir/Pibrentasvir',
  'epclusa': 'Sofosbuvir/Velpatasvir',

  // ── Corticosteroids ───────────────────────────────────────────
  'prednisone': 'Prednisone',
  'medrol': 'Methylprednisolone',
  'decadron': 'Dexamethasone',
  'deltasone': 'Prednisone',
  'orapred': 'Prednisolone',
  'prelone': 'Prednisolone',
  'cortef': 'Hydrocortisone',
  'kenalog': 'Triamcinolone',
  'aristocort': 'Triamcinolone',
  'celestone': 'Betamethasone',
  'entocort': 'Budesonide',

  // ── Muscle Relaxants ──────────────────────────────────────────
  'flexeril': 'Cyclobenzaprine',
  'amrix': 'Cyclobenzaprine',
  'zanaflex': 'Tizanidine',
  'robaxin': 'Methocarbamol',
  'soma': 'Carisoprodol',
  'skelaxin': 'Metaxalone',
  'baclofen': 'Baclofen',
  'lioresal': 'Baclofen',
  'dantrium': 'Dantrolene',
  'norflex': 'Orphenadrine',

  // ── Migraine ──────────────────────────────────────────────────
  'imitrex': 'Sumatriptan',
  'maxalt': 'Rizatriptan',
  'zomig': 'Zolmitriptan',
  'relpax': 'Eletriptan',
  'amerge': 'Naratriptan',
  'frova': 'Frovatriptan',
  'axert': 'Almotriptan',
  'treximet': 'Sumatriptan/Naproxen',
  'ubrelvy': 'Ubrogepant',
  'nurtec': 'Rimegepant',
  'aimovig': 'Erenumab',
  'ajovy': 'Fremanezumab',
  'emgality': 'Galcanezumab',
  'qulipta': 'Atogepant',
  'cafergot': 'Ergotamine/Caffeine',
  'midrin': 'Acetaminophen/Dichloralphenazone/Isometheptene',
  'fioricet': 'Butalbital/Acetaminophen/Caffeine',
  'fiorinal': 'Butalbital/Aspirin/Caffeine',

  // ── Erectile Dysfunction / Urology ─────────────────────────────
  'viagra': 'Sildenafil',
  'cialis': 'Tadalafil',
  'levitra': 'Vardenafil',
  'stendra': 'Avanafil',
  'flomax': 'Tamsulosin',
  'rapaflo': 'Silodosin',
  'uroxatral': 'Alfuzosin',
  'jalyn': 'Dutasteride/Tamsulosin',
  'avodart': 'Dutasteride',
  'proscar': 'Finasteride',
  'propecia': 'Finasteride',
  'rogaine': 'Minoxidil',
  'loniten': 'Minoxidil',
  'myrbetriq': 'Mirabegron',
  'detrol': 'Tolterodine',
  'ditropan': 'Oxybutynin',
  'vesicare': 'Solifenacin',
  'enablex': 'Darifenacin',
  'toviaz': 'Fesoterodine',
  'gemtesa': 'Vibegron',

  // ── Autoimmune / Biologic / Immunology ─────────────────────────
  'humira': 'Adalimumab',
  'enbrel': 'Etanercept',
  'remicade': 'Infliximab',
  'stelara': 'Ustekinumab',
  'cosentyx': 'Secukinumab',
  'taltz': 'Ixekizumab',
  'skyrizi': 'Risankizumab',
  'tremfya': 'Guselkumab',
  'rinvoq': 'Upadacitinib',
  'xeljanz': 'Tofacitinib',
  'olumiant': 'Baricitinib',
  'otezla': 'Apremilast',
  'orencia': 'Abatacept',
  'actemra': 'Tocilizumab',
  'rituxan': 'Rituximab',
  'plaquenil': 'Hydroxychloroquine',
  'arava': 'Leflunomide',
  'methotrexate': 'Methotrexate',
  'imuran': 'Azathioprine',
  'cellcept': 'Mycophenolate',
  'prograf': 'Tacrolimus',
  'neoral': 'Cyclosporine',
  'sandimmune': 'Cyclosporine',
  'rapamune': 'Sirolimus',

  // ── Osteoporosis / Bone Health ─────────────────────────────────
  'fosamax': 'Alendronate',
  'actonel': 'Risedronate',
  'boniva': 'Ibandronate',
  'reclast': 'Zoledronic Acid',
  'prolia': 'Denosumab',
  'forteo': 'Teriparatide',
  'tymlos': 'Abaloparatide',
  'evenity': 'Romosozumab',
  'evista': 'Raloxifene',
  'miacalcin': 'Calcitonin',

  // ── Gout ──────────────────────────────────────────────────────
  'zyloprim': 'Allopurinol',
  'uloric': 'Febuxostat',
  'colcrys': 'Colchicine',
  'krystexxa': 'Pegloticase',
  'zurampic': 'Lesinurad',

  // ── Dermatology ───────────────────────────────────────────────
  'accutane': 'Isotretinoin',
  'absorica': 'Isotretinoin',
  'retin-a': 'Tretinoin',
  'differin': 'Adapalene',
  'tazorac': 'Tazarotene',
  'dovonex': 'Calcipotriene',
  'eucrisa': 'Crisaborole',
  'protopic': 'Tacrolimus',
  'elidel': 'Pimecrolimus',
  'temovate': 'Clobetasol',
  'lidex': 'Fluocinonide',
  'topicort': 'Desoximetasone',

  // ── Eye / Ophthalmic ──────────────────────────────────────────
  'lumigan': 'Bimatoprost',
  'xalatan': 'Latanoprost',
  'travatan': 'Travoprost',
  'timoptic': 'Timolol',
  'alphagan': 'Brimonidine',
  'trusopt': 'Dorzolamide',
  'azopt': 'Brinzolamide',
  'combigan': 'Brimonidine/Timolol',
  'cosopt': 'Dorzolamide/Timolol',
  'restasis': 'Cyclosporine',
  'xiidra': 'Lifitegrast',
  'pataday': 'Olopatadine',
  'zaditor': 'Ketotifen',

  // ── Parkinson's / Neurological ─────────────────────────────────
  'sinemet': 'Carbidopa/Levodopa',
  'stalevo': 'Carbidopa/Levodopa/Entacapone',
  'comtan': 'Entacapone',
  'mirapex': 'Pramipexole',
  'requip': 'Ropinirole',
  'neupro': 'Rotigotine',
  'azilect': 'Rasagiline',
  'eldepryl': 'Selegiline',
  'symmetrel': 'Amantadine',
  'cogentin': 'Benztropine',
  'artane': 'Trihexyphenidyl',
  'aricept': 'Donepezil',
  'exelon': 'Rivastigmine',
  'razadyne': 'Galantamine',
  'namenda': 'Memantine',
  'namzaric': 'Memantine/Donepezil',
  'nuplazid': 'Pimavanserin',

  // ── Multiple Sclerosis ────────────────────────────────────────
  'copaxone': 'Glatiramer',
  'tecfidera': 'Dimethyl Fumarate',
  'vumerity': 'Diroximel Fumarate',
  'gilenya': 'Fingolimod',
  'mayzent': 'Siponimod',
  'zeposia': 'Ozanimod',
  'aubagio': 'Teriflunomide',
  'tysabri': 'Natalizumab',
  'ocrevus': 'Ocrelizumab',
  'kesimpta': 'Ofatumumab',
  'lemtrada': 'Alemtuzumab',
  'mavenclad': 'Cladribine',
  'rebif': 'Interferon Beta-1a',
  'avonex': 'Interferon Beta-1a',
  'betaseron': 'Interferon Beta-1b',

  // ── Hormonal / Reproductive ───────────────────────────────────
  'premarin': 'Conjugated Estrogens',
  'estrace': 'Estradiol',
  'vivelle': 'Estradiol',
  'climara': 'Estradiol',
  'divigel': 'Estradiol',
  'prempro': 'Conjugated Estrogens/Medroxyprogesterone',
  'provera': 'Medroxyprogesterone',
  'prometrium': 'Progesterone',
  'depo-provera': 'Medroxyprogesterone',
  'androgel': 'Testosterone',
  'testim': 'Testosterone',
  'axiron': 'Testosterone',
  'clomid': 'Clomiphene',
  'femara': 'Letrozole',
  'nolvadex': 'Tamoxifen',
  'arimidex': 'Anastrozole',
  'aromasin': 'Exemestane',
  'lupron': 'Leuprolide',
  'zoladex': 'Goserelin',

  // ── Weight Management ─────────────────────────────────────────
  'contrave': 'Naltrexone/Bupropion',
  'qsymia': 'Phentermine/Topiramate',
  'adipex': 'Phentermine',
  'xenical': 'Orlistat',
  'alli': 'Orlistat',

  // ── Smoking Cessation ─────────────────────────────────────────
  'chantix': 'Varenicline',
  'nicotrol': 'Nicotine',

  // ── Alcohol / Addiction ───────────────────────────────────────
  'antabuse': 'Disulfiram',
  'campral': 'Acamprosate',
  'vivitrol': 'Naltrexone',
  'revia': 'Naltrexone',

  // ── Supplements / OTC with brand recognition ──────────────────
  'caltrate': 'Calcium Carbonate',
  'citracal': 'Calcium Citrate',
  'tums': 'Calcium Carbonate',
  'oscal': 'Calcium Carbonate',
  'slow-mag': 'Magnesium Chloride',
  'mag-ox': 'Magnesium Oxide',
  'slow fe': 'Ferrous Sulfate',
  'feosol': 'Ferrous Sulfate',
  'ferro-sequels': 'Ferrous Fumarate',
};

export async function fetchDrugSuggestions(query: string): Promise<string[]> {
  try {
    const encoded = encodeURIComponent(query);
    const lower = query.toLowerCase().trim();

    // Check if the query matches a known brand name — show generic equivalent first
    const seen = new Set<string>();
    const merged: string[] = [];

    const addUnique = (name: string) => {
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(name);
      }
    };

    // If it's a known brand name, add the generic equivalent first
    const genericMatch = BRAND_TO_GENERIC[lower];
    if (genericMatch) {
      addUnique(`${genericMatch} (${query.charAt(0).toUpperCase() + query.slice(1).toLowerCase()})`);
      addUnique(genericMatch);
    }

    // Also check partial brand name matches
    for (const [brand, generic] of Object.entries(BRAND_TO_GENERIC)) {
      if (brand.startsWith(lower) && brand !== lower) {
        const brandTitle = brand.charAt(0).toUpperCase() + brand.slice(1);
        addUnique(`${generic} (${brandTitle})`);
      }
    }

    // Clinical Tables API + spelling suggestions
    const [autoRes, spellRes] = await Promise.all([
      fetch(
        `https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${encoded}&ef=DISPLAY_NAME&maxList=10`
      ),
      fetch(
        `https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${encoded}`
      ),
    ]);

    // Clinical Tables results
    if (autoRes.ok) {
      const data: any = await autoRes.json();
      const displayNames: string[] = data[1] || [];
      for (const d of displayNames) {
        addUnique(cleanDrugName(d));
      }
    }

    // Spelling suggestions for typo handling
    if (spellRes.ok) {
      const data: any = await spellRes.json();
      const suggestions: string[] = data.suggestionGroup?.suggestionList?.suggestion || [];
      for (const name of suggestions) addUnique(name);
    }

    return merged.slice(0, 10);
  } catch {
    return [];
  }
}

export async function fetchAllergySuggestions(query: string): Promise<string[]> {
  try {
    const encoded = encodeURIComponent(query);
    const [autoRes, spellRes] = await Promise.all([
      fetch(
        `https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${encoded}&ef=DISPLAY_NAME&maxList=6`
      ),
      fetch(
        `https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${encoded}`
      ),
    ]);

    const seen = new Set<string>();
    const merged: string[] = [];

    const addUnique = (name: string) => {
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(name);
      }
    };

    if (autoRes.ok) {
      const data: any = await autoRes.json();
      const displayNames: string[] = data[1] || [];
      for (const d of displayNames) addUnique(cleanDrugName(d));
    }

    if (spellRes.ok) {
      const data: any = await spellRes.json();
      const suggestions: string[] = data.suggestionGroup?.suggestionList?.suggestion || [];
      for (const name of suggestions) addUnique(name);
    }

    return merged.slice(0, 6);
  } catch {
    return [];
  }
}

/**
 * Resolve a drug name to its generic equivalent.
 * If it's a known brand name, returns the generic.
 * Also handles "Generic (Brand)" format from autocomplete.
 * Returns the original name if no match found.
 */
export function resolveGenericName(name: string): string {
  // Handle "Acetaminophen (Tylenol)" format — extract just the generic part
  const parenMatch = name.match(/^(.+?)\s*\(.*\)$/);
  if (parenMatch) return parenMatch[1].trim();

  const lower = name.toLowerCase().trim();
  return BRAND_TO_GENERIC[lower] || name;
}

export const COMMON_ALLERGENS = [
  'Amoxicillin',
  'Penicillin',
  'Sulfa / Sulfonamide',
  'Cephalosporin',
  'Aspirin',
  'NSAIDs',
  'Codeine',
  'Opioids',
  'Tetracycline',
  'Fluoroquinolone',
  'Macrolide',
  'Erythromycin',
  'Latex',
  'Iodine',
  'Contrast dye',
  'ACE Inhibitor',
  'Statin',
  'Benzodiazepine',
  'SSRI',
  'Beta Blocker',
];
