import { CriticalInteraction, Medication, Interaction, Allergy, AllergyConflict, RefillStatus } from '../types';

// ─── Expanded offline interaction database (45+ entries) ─────────────────────
// Sources: ONC High-Priority DDI list, FDA drug labels, clinical references.
// This is general reference information, not medical advice.

export const CRITICAL_INTERACTIONS: CriticalInteraction[] = [
  // ── Anticoagulant interactions (bleeding risk) ──
  { drug1: 'warfarin', drug2: 'aspirin', severity: 'major', description: 'May significantly increase bleeding risk when combined.', info: 'Consult your healthcare provider about taking these together.' },
  { drug1: 'warfarin', drug2: 'ibuprofen', severity: 'major', description: 'NSAIDs may increase bleeding risk with warfarin.', info: 'Discuss alternative pain relievers with your provider.' },
  { drug1: 'warfarin', drug2: 'naproxen', severity: 'major', description: 'NSAIDs may increase bleeding risk with warfarin.', info: 'Discuss alternative pain relievers with your provider.' },
  { drug1: 'warfarin', drug2: 'fluconazole', severity: 'major', description: 'Fluconazole may increase warfarin levels, raising bleeding risk.', info: 'Your provider may need to adjust warfarin dosage and monitor INR closely.' },
  { drug1: 'warfarin', drug2: 'amiodarone', severity: 'major', description: 'Amiodarone may increase warfarin levels significantly.', info: 'Warfarin dose may need to be reduced. Close INR monitoring required.' },
  { drug1: 'warfarin', drug2: 'metronidazole', severity: 'major', description: 'Metronidazole may increase warfarin effect and bleeding risk.', info: 'INR should be monitored closely during and after treatment.' },
  { drug1: 'warfarin', drug2: 'omeprazole', severity: 'moderate', description: 'Omeprazole may affect warfarin metabolism.', info: 'Monitor INR when starting or stopping omeprazole.' },
  { drug1: 'warfarin', drug2: 'clopidogrel', severity: 'major', description: 'Combining anticoagulant with antiplatelet greatly increases bleeding risk.', info: 'This combination requires close monitoring. Report any unusual bleeding.' },
  { drug1: 'warfarin', drug2: 'erythromycin', severity: 'major', description: 'Erythromycin may increase warfarin levels and bleeding risk.', info: 'INR should be monitored closely during antibiotic treatment.' },
  { drug1: 'warfarin', drug2: 'amoxicillin', severity: 'moderate', description: 'Amoxicillin may increase warfarin effect and bleeding risk.', info: 'INR should be monitored during and shortly after antibiotic treatment. Report any unusual bleeding.' },
  { drug1: 'warfarin', drug2: 'sulfamethoxazole', severity: 'major', description: 'Sulfamethoxazole (Bactrim) may significantly increase warfarin effect.', info: 'INR monitoring is critical. Dose adjustment may be needed.' },
  { drug1: 'warfarin', drug2: 'trimethoprim', severity: 'major', description: 'Trimethoprim (Bactrim) may significantly increase warfarin effect.', info: 'INR monitoring is critical. Dose adjustment may be needed.' },
  { drug1: 'warfarin', drug2: 'phenytoin', severity: 'major', description: 'Complex interaction — each drug may alter the other\'s levels.', info: 'Both INR and phenytoin levels should be monitored closely.' },
  { drug1: 'warfarin', drug2: 'carbamazepine', severity: 'major', description: 'Carbamazepine may decrease warfarin effectiveness.', info: 'INR should be monitored when starting or stopping carbamazepine.' },
  { drug1: 'warfarin', drug2: 'sertraline', severity: 'moderate', description: 'Sertraline may increase warfarin levels and bleeding risk.', info: 'INR should be monitored when starting or stopping sertraline.' },
  { drug1: 'apixaban', drug2: 'ketoconazole', severity: 'major', description: 'Ketoconazole may significantly increase apixaban levels.', info: 'This combination should generally be avoided. Consult your provider.' },
  { drug1: 'apixaban', drug2: 'rifampin', severity: 'major', description: 'Rifampin may significantly decrease apixaban levels, reducing effectiveness.', info: 'This combination should be avoided. Discuss alternatives with your provider.' },
  { drug1: 'apixaban', drug2: 'aspirin', severity: 'major', description: 'Combining anticoagulant with aspirin increases bleeding risk.', info: 'Only use together if specifically directed by your provider.' },
  { drug1: 'apixaban', drug2: 'ibuprofen', severity: 'major', description: 'NSAIDs increase bleeding risk with anticoagulants.', info: 'Discuss alternative pain relievers with your provider.' },
  { drug1: 'rivaroxaban', drug2: 'ketoconazole', severity: 'major', description: 'Ketoconazole may significantly increase rivaroxaban levels.', info: 'This combination should generally be avoided. Consult your provider.' },
  { drug1: 'rivaroxaban', drug2: 'rifampin', severity: 'major', description: 'Rifampin may significantly decrease rivaroxaban levels, reducing effectiveness.', info: 'This combination should be avoided. Discuss alternatives with your provider.' },
  { drug1: 'rivaroxaban', drug2: 'aspirin', severity: 'major', description: 'Combining anticoagulant with aspirin increases bleeding risk.', info: 'Only use together if specifically directed by your provider.' },
  { drug1: 'dabigatran', drug2: 'ketoconazole', severity: 'major', description: 'Ketoconazole may significantly increase dabigatran levels.', info: 'This combination should be avoided.' },
  { drug1: 'dabigatran', drug2: 'rifampin', severity: 'major', description: 'Rifampin may significantly decrease dabigatran levels.', info: 'This combination should be avoided.' },
  { drug1: 'clopidogrel', drug2: 'omeprazole', severity: 'major', description: 'Omeprazole may reduce clopidogrel effectiveness.', info: 'Consider pantoprazole as an alternative PPI. Discuss with your provider.' },
  { drug1: 'clopidogrel', drug2: 'aspirin', severity: 'moderate', description: 'Dual antiplatelet therapy increases bleeding risk.', info: 'This combination is sometimes prescribed intentionally but requires monitoring.' },

  // ── ACE inhibitor / ARB interactions ──
  { drug1: 'lisinopril', drug2: 'spironolactone', severity: 'major', description: 'May increase potassium levels, which could affect heart function.', info: 'Your provider should monitor potassium levels if taking both.' },
  { drug1: 'lisinopril', drug2: 'potassium', severity: 'major', description: 'ACE inhibitors with potassium supplements may cause dangerously high potassium.', info: 'Do not take potassium supplements without your provider\'s guidance.' },
  { drug1: 'lisinopril', drug2: 'ibuprofen', severity: 'moderate', description: 'NSAIDs may reduce effectiveness of blood pressure medications.', info: 'Ask your pharmacist about alternative pain relievers.' },
  { drug1: 'lisinopril', drug2: 'naproxen', severity: 'moderate', description: 'NSAIDs may reduce effectiveness of blood pressure medications.', info: 'Ask your pharmacist about alternative pain relievers.' },
  { drug1: 'lisinopril', drug2: 'aliskiren', severity: 'major', description: 'Combining ACE inhibitors with aliskiren increases risk of kidney problems and high potassium.', info: 'This combination is generally not recommended, especially in diabetic patients.' },
  { drug1: 'losartan', drug2: 'spironolactone', severity: 'major', description: 'May increase potassium levels, which could affect heart function.', info: 'Your provider should monitor potassium levels if taking both.' },
  { drug1: 'losartan', drug2: 'potassium', severity: 'major', description: 'ARBs with potassium supplements may cause dangerously high potassium.', info: 'Do not take potassium supplements without your provider\'s guidance.' },
  { drug1: 'losartan', drug2: 'ibuprofen', severity: 'moderate', description: 'NSAIDs may reduce ARB effectiveness and harm kidneys.', info: 'Ask your pharmacist about alternative pain relievers.' },
  { drug1: 'losartan', drug2: 'naproxen', severity: 'moderate', description: 'NSAIDs may reduce ARB effectiveness and harm kidneys.', info: 'Ask your pharmacist about alternative pain relievers.' },
  { drug1: 'losartan', drug2: 'lithium', severity: 'major', description: 'ARBs may increase lithium levels to toxic range.', info: 'Lithium levels should be monitored closely.' },
  { drug1: 'enalapril', drug2: 'spironolactone', severity: 'major', description: 'May increase potassium levels, which could affect heart function.', info: 'Your provider should monitor potassium levels if taking both.' },
  { drug1: 'enalapril', drug2: 'potassium', severity: 'major', description: 'ACE inhibitors with potassium supplements may cause dangerously high potassium.', info: 'Do not take potassium supplements without your provider\'s guidance.' },
  { drug1: 'valsartan', drug2: 'spironolactone', severity: 'major', description: 'May increase potassium levels, which could affect heart function.', info: 'Your provider should monitor potassium levels if taking both.' },
  { drug1: 'valsartan', drug2: 'potassium', severity: 'major', description: 'ARBs with potassium supplements may cause dangerously high potassium.', info: 'Do not take potassium supplements without your provider\'s guidance.' },
  { drug1: 'lisinopril', drug2: 'losartan', severity: 'major', description: 'Combining an ACE inhibitor with an ARB increases risk of low blood pressure, high potassium, and kidney problems.', info: 'This combination is generally not recommended.' },
  { drug1: 'lisinopril', drug2: 'lithium', severity: 'major', description: 'ACE inhibitors may increase lithium levels to toxic range.', info: 'Lithium levels should be monitored closely.' },

  // ── Statin interactions ──
  { drug1: 'simvastatin', drug2: 'amlodipine', severity: 'moderate', description: 'Amlodipine may increase simvastatin levels in the body.', info: 'Simvastatin dose should not exceed 20mg with amlodipine. Report any unusual muscle pain.' },
  { drug1: 'simvastatin', drug2: 'amiodarone', severity: 'major', description: 'Amiodarone may significantly increase simvastatin levels, raising risk of muscle damage.', info: 'Simvastatin dose should not exceed 20mg with amiodarone.' },
  { drug1: 'simvastatin', drug2: 'clarithromycin', severity: 'major', description: 'Clarithromycin may greatly increase statin levels, risking muscle damage.', info: 'This combination should generally be avoided during antibiotic treatment.' },
  { drug1: 'simvastatin', drug2: 'diltiazem', severity: 'major', description: 'Diltiazem may increase simvastatin levels, raising risk of muscle damage.', info: 'Simvastatin dose should not exceed 10mg with diltiazem.' },
  { drug1: 'simvastatin', drug2: 'verapamil', severity: 'major', description: 'Verapamil may increase simvastatin levels, raising risk of muscle damage.', info: 'Simvastatin dose should not exceed 10mg with verapamil.' },
  { drug1: 'simvastatin', drug2: 'cyclosporine', severity: 'major', description: 'Cyclosporine may greatly increase simvastatin levels.', info: 'This combination should generally be avoided.' },
  { drug1: 'simvastatin', drug2: 'grapefruit', severity: 'moderate', description: 'Grapefruit juice may increase simvastatin levels.', info: 'Avoid consuming large amounts of grapefruit while on simvastatin.' },
  { drug1: 'atorvastatin', drug2: 'clarithromycin', severity: 'major', description: 'Clarithromycin may greatly increase statin levels, risking muscle damage.', info: 'Your provider may temporarily pause the statin during antibiotic treatment.' },
  { drug1: 'atorvastatin', drug2: 'cyclosporine', severity: 'major', description: 'Cyclosporine may greatly increase atorvastatin levels.', info: 'This combination should generally be avoided.' },
  { drug1: 'atorvastatin', drug2: 'erythromycin', severity: 'major', description: 'Erythromycin may increase statin levels, risking muscle damage.', info: 'Your provider may adjust dosages during antibiotic treatment.' },
  { drug1: 'atorvastatin', drug2: 'itraconazole', severity: 'major', description: 'Itraconazole may greatly increase atorvastatin levels.', info: 'This combination should generally be avoided.' },
  { drug1: 'atorvastatin', drug2: 'gemfibrozil', severity: 'major', description: 'Gemfibrozil with statins greatly increases risk of muscle damage (rhabdomyolysis).', info: 'This combination should be avoided if possible.' },
  { drug1: 'lovastatin', drug2: 'erythromycin', severity: 'major', description: 'Erythromycin may greatly increase statin levels, risking muscle damage.', info: 'This combination should generally be avoided.' },
  { drug1: 'lovastatin', drug2: 'itraconazole', severity: 'major', description: 'Itraconazole may greatly increase lovastatin levels.', info: 'This combination should generally be avoided.' },
  { drug1: 'rosuvastatin', drug2: 'cyclosporine', severity: 'major', description: 'Cyclosporine may greatly increase rosuvastatin levels.', info: 'Rosuvastatin dose should not exceed 5mg with cyclosporine.' },
  { drug1: 'rosuvastatin', drug2: 'gemfibrozil', severity: 'major', description: 'Gemfibrozil with statins increases risk of muscle damage.', info: 'Rosuvastatin dose should not exceed 10mg with gemfibrozil.' },

  // ── Diabetes medication interactions ──
  { drug1: 'metformin', drug2: 'contrast dye', severity: 'major', description: 'Metformin may need to be stopped before procedures involving contrast dye.', info: 'Inform your doctor and radiologist if you take metformin.' },
  { drug1: 'metformin', drug2: 'alcohol', severity: 'moderate', description: 'Alcohol may increase certain risks when combined with metformin.', info: 'Discuss alcohol consumption with your healthcare provider.' },
  { drug1: 'metformin', drug2: 'furosemide', severity: 'moderate', description: 'Furosemide may increase metformin levels.', info: 'Your provider may monitor kidney function and adjust doses.' },
  { drug1: 'glipizide', drug2: 'fluconazole', severity: 'major', description: 'Fluconazole may increase glipizide levels, causing dangerously low blood sugar.', info: 'Blood sugar should be monitored closely during treatment.' },
  { drug1: 'glipizide', drug2: 'ciprofloxacin', severity: 'major', description: 'Ciprofloxacin may increase glipizide levels, causing low blood sugar.', info: 'Blood sugar should be monitored closely during antibiotic treatment.' },
  { drug1: 'glyburide', drug2: 'fluconazole', severity: 'major', description: 'Fluconazole may increase glyburide levels, causing dangerously low blood sugar.', info: 'Blood sugar should be monitored closely during treatment.' },
  { drug1: 'glyburide', drug2: 'ciprofloxacin', severity: 'major', description: 'Ciprofloxacin may alter glyburide levels, affecting blood sugar control.', info: 'Blood sugar should be monitored closely during antibiotic treatment.' },
  { drug1: 'insulin', drug2: 'glipizide', severity: 'moderate', description: 'Using both may increase risk of low blood sugar.', info: 'Monitor blood sugar closely and know signs of hypoglycemia.' },
  { drug1: 'insulin', drug2: 'glyburide', severity: 'moderate', description: 'Using both may increase risk of low blood sugar.', info: 'Monitor blood sugar closely and know signs of hypoglycemia.' },
  { drug1: 'insulin', drug2: 'metformin', severity: 'moderate', description: 'Combining insulin with metformin increases hypoglycemia risk.', info: 'Monitor blood sugar closely, especially when adjusting doses.' },
  { drug1: 'insulin', drug2: 'pioglitazone', severity: 'moderate', description: 'Pioglitazone with insulin may increase risk of fluid retention and heart failure.', info: 'Report any swelling, weight gain, or shortness of breath.' },
  { drug1: 'metformin', drug2: 'dapagliflozin', severity: 'moderate', description: 'Combining diabetes medications may increase hypoglycemia risk.', info: 'Monitor blood sugar closely.' },
  { drug1: 'metformin', drug2: 'empagliflozin', severity: 'moderate', description: 'Combining diabetes medications may increase hypoglycemia risk.', info: 'Monitor blood sugar closely.' },

  // ── Heart / cardiac interactions ──
  { drug1: 'digoxin', drug2: 'furosemide', severity: 'moderate', description: 'Furosemide may lower potassium, increasing digoxin toxicity risk.', info: 'Your provider may monitor potassium and digoxin levels.' },
  { drug1: 'digoxin', drug2: 'amiodarone', severity: 'major', description: 'Amiodarone may increase digoxin levels significantly.', info: 'Digoxin dose typically needs to be reduced by half.' },
  { drug1: 'digoxin', drug2: 'verapamil', severity: 'major', description: 'Verapamil may increase digoxin levels.', info: 'Your provider should monitor digoxin levels closely.' },
  { drug1: 'digoxin', drug2: 'diltiazem', severity: 'major', description: 'Diltiazem may increase digoxin levels.', info: 'Your provider should monitor digoxin levels closely.' },
  { drug1: 'digoxin', drug2: 'clarithromycin', severity: 'major', description: 'Clarithromycin may increase digoxin levels to toxic range.', info: 'Digoxin levels should be monitored during antibiotic treatment.' },
  { drug1: 'digoxin', drug2: 'erythromycin', severity: 'major', description: 'Erythromycin may increase digoxin levels.', info: 'Digoxin levels should be monitored during antibiotic treatment.' },
  { drug1: 'digoxin', drug2: 'spironolactone', severity: 'moderate', description: 'Spironolactone may increase digoxin levels.', info: 'Your provider may need to monitor digoxin levels.' },
  { drug1: 'digoxin', drug2: 'hydrochlorothiazide', severity: 'moderate', description: 'Hydrochlorothiazide may lower potassium, increasing digoxin toxicity risk.', info: 'Potassium and digoxin levels should be monitored.' },
  { drug1: 'metoprolol', drug2: 'verapamil', severity: 'major', description: 'Both slow heart rate and combining them may cause dangerously slow heartbeat.', info: 'This combination requires close cardiac monitoring.' },
  { drug1: 'metoprolol', drug2: 'diltiazem', severity: 'major', description: 'Both slow heart rate and combining them may cause dangerously slow heartbeat.', info: 'This combination requires close cardiac monitoring.' },
  { drug1: 'metoprolol', drug2: 'clonidine', severity: 'major', description: 'Stopping clonidine while on a beta-blocker may cause rebound hypertension.', info: 'Never stop clonidine abruptly. Discuss any changes with your provider.' },
  { drug1: 'metoprolol', drug2: 'fluoxetine', severity: 'moderate', description: 'Fluoxetine may increase metoprolol levels.', info: 'Your provider may monitor heart rate and blood pressure.' },
  { drug1: 'atenolol', drug2: 'verapamil', severity: 'major', description: 'Both slow heart rate and combining them may cause dangerously slow heartbeat.', info: 'This combination requires close cardiac monitoring.' },
  { drug1: 'atenolol', drug2: 'diltiazem', severity: 'major', description: 'Both slow heart rate and combining them may cause dangerously slow heartbeat.', info: 'This combination requires close cardiac monitoring.' },
  { drug1: 'atenolol', drug2: 'clonidine', severity: 'major', description: 'Stopping clonidine while on a beta-blocker may cause rebound hypertension.', info: 'Never stop clonidine abruptly. Discuss any changes with your provider.' },
  { drug1: 'propranolol', drug2: 'verapamil', severity: 'major', description: 'Both slow heart rate and combining them may cause dangerously slow heartbeat.', info: 'This combination requires close cardiac monitoring.' },
  { drug1: 'propranolol', drug2: 'diltiazem', severity: 'major', description: 'Both slow heart rate and combining them may cause dangerously slow heartbeat.', info: 'This combination requires close cardiac monitoring.' },
  { drug1: 'carvedilol', drug2: 'verapamil', severity: 'major', description: 'Both slow heart rate and combining them may cause dangerously slow heartbeat.', info: 'This combination requires close cardiac monitoring.' },
  { drug1: 'carvedilol', drug2: 'diltiazem', severity: 'major', description: 'Both slow heart rate and combining them may cause dangerously slow heartbeat.', info: 'This combination requires close cardiac monitoring.' },
  { drug1: 'amiodarone', drug2: 'metoprolol', severity: 'major', description: 'Combining may cause dangerously slow heart rate.', info: 'Heart rate and rhythm should be monitored closely.' },
  { drug1: 'amiodarone', drug2: 'diltiazem', severity: 'major', description: 'Combining may cause dangerously slow heart rate.', info: 'Heart rate and rhythm should be monitored closely.' },
  { drug1: 'amiodarone', drug2: 'simvastatin', severity: 'major', description: 'Amiodarone may significantly increase simvastatin levels, raising risk of muscle damage.', info: 'Simvastatin dose should not exceed 20mg with amiodarone.' },
  { drug1: 'amlodipine', drug2: 'cyclosporine', severity: 'major', description: 'Amlodipine may increase cyclosporine levels.', info: 'Cyclosporine levels should be monitored if starting amlodipine.' },
  { drug1: 'nitroglycerin', drug2: 'sildenafil', severity: 'major', description: 'Combining nitrates with PDE5 inhibitors may cause life-threatening low blood pressure.', info: 'This combination is absolutely contraindicated. Never take together.' },
  { drug1: 'nitroglycerin', drug2: 'tadalafil', severity: 'major', description: 'Combining nitrates with PDE5 inhibitors may cause life-threatening low blood pressure.', info: 'This combination is absolutely contraindicated. Never take together.' },
  { drug1: 'isosorbide', drug2: 'sildenafil', severity: 'major', description: 'Combining nitrates with PDE5 inhibitors may cause life-threatening low blood pressure.', info: 'This combination is absolutely contraindicated. Never take together.' },
  { drug1: 'isosorbide', drug2: 'tadalafil', severity: 'major', description: 'Combining nitrates with PDE5 inhibitors may cause life-threatening low blood pressure.', info: 'This combination is absolutely contraindicated. Never take together.' },

  // ── SSRI / antidepressant interactions ──
  { drug1: 'sertraline', drug2: 'tramadol', severity: 'major', description: 'Combining SSRIs with tramadol may increase risk of serotonin syndrome.', info: 'Watch for agitation, rapid heartbeat, fever, or muscle rigidity.' },
  { drug1: 'fluoxetine', drug2: 'tramadol', severity: 'major', description: 'Combining SSRIs with tramadol may increase risk of serotonin syndrome.', info: 'Watch for agitation, rapid heartbeat, fever, or muscle rigidity.' },
  { drug1: 'paroxetine', drug2: 'tramadol', severity: 'major', description: 'Combining SSRIs with tramadol may increase risk of serotonin syndrome.', info: 'Watch for agitation, rapid heartbeat, fever, or muscle rigidity.' },
  { drug1: 'citalopram', drug2: 'tramadol', severity: 'major', description: 'Combining SSRIs with tramadol may increase risk of serotonin syndrome.', info: 'Watch for agitation, rapid heartbeat, fever, or muscle rigidity.' },
  { drug1: 'escitalopram', drug2: 'tramadol', severity: 'major', description: 'Combining SSRIs with tramadol may increase risk of serotonin syndrome.', info: 'Watch for agitation, rapid heartbeat, fever, or muscle rigidity.' },
  { drug1: 'sertraline', drug2: 'sumatriptan', severity: 'moderate', description: 'SSRIs with triptans may increase serotonin syndrome risk.', info: 'Report any unusual symptoms to your provider immediately.' },
  { drug1: 'fluoxetine', drug2: 'sumatriptan', severity: 'moderate', description: 'SSRIs with triptans may increase serotonin syndrome risk.', info: 'Report any unusual symptoms to your provider immediately.' },
  { drug1: 'paroxetine', drug2: 'sumatriptan', severity: 'moderate', description: 'SSRIs with triptans may increase serotonin syndrome risk.', info: 'Report any unusual symptoms to your provider immediately.' },
  { drug1: 'fluoxetine', drug2: 'warfarin', severity: 'moderate', description: 'Fluoxetine may increase warfarin levels and bleeding risk.', info: 'INR should be monitored when starting or stopping fluoxetine.' },
  { drug1: 'fluoxetine', drug2: 'metoprolol', severity: 'moderate', description: 'Fluoxetine may increase metoprolol levels.', info: 'Your provider may monitor heart rate and blood pressure.' },
  { drug1: 'paroxetine', drug2: 'metoprolol', severity: 'moderate', description: 'Paroxetine may increase metoprolol levels.', info: 'Your provider may monitor heart rate and blood pressure.' },
  { drug1: 'fluoxetine', drug2: 'tamoxifen', severity: 'major', description: 'Fluoxetine may reduce tamoxifen effectiveness by blocking its activation.', info: 'An alternative antidepressant should be considered.' },
  { drug1: 'paroxetine', drug2: 'tamoxifen', severity: 'major', description: 'Paroxetine may reduce tamoxifen effectiveness by blocking its activation.', info: 'An alternative antidepressant should be considered.' },
  { drug1: 'sertraline', drug2: 'linezolid', severity: 'major', description: 'Linezolid is an MAO inhibitor — combining with SSRIs risks serotonin syndrome.', info: 'This combination should be avoided when possible.' },
  { drug1: 'fluoxetine', drug2: 'linezolid', severity: 'major', description: 'Linezolid is an MAO inhibitor — combining with SSRIs risks serotonin syndrome.', info: 'This combination should be avoided when possible.' },
  { drug1: 'citalopram', drug2: 'erythromycin', severity: 'major', description: 'Erythromycin may increase citalopram levels and QT prolongation risk.', info: 'This combination should be avoided. Discuss alternatives with your provider.' },
  { drug1: 'escitalopram', drug2: 'erythromycin', severity: 'major', description: 'Erythromycin may increase escitalopram levels and QT prolongation risk.', info: 'This combination should be avoided. Discuss alternatives with your provider.' },
  { drug1: 'duloxetine', drug2: 'tramadol', severity: 'major', description: 'Combining SNRIs with tramadol increases risk of serotonin syndrome.', info: 'Watch for agitation, rapid heartbeat, fever, or muscle rigidity.' },
  { drug1: 'venlafaxine', drug2: 'tramadol', severity: 'major', description: 'Combining SNRIs with tramadol increases risk of serotonin syndrome.', info: 'Watch for agitation, rapid heartbeat, fever, or muscle rigidity.' },
  { drug1: 'duloxetine', drug2: 'linezolid', severity: 'major', description: 'Linezolid is an MAO inhibitor — combining with SNRIs risks serotonin syndrome.', info: 'This combination should be avoided when possible.' },
  { drug1: 'venlafaxine', drug2: 'linezolid', severity: 'major', description: 'Linezolid is an MAO inhibitor — combining with SNRIs risks serotonin syndrome.', info: 'This combination should be avoided when possible.' },

  // ── Opioid interactions ──
  { drug1: 'oxycodone', drug2: 'alprazolam', severity: 'major', description: 'Combining opioids with benzodiazepines may cause dangerous sedation and breathing problems.', info: 'FDA warns against combining these medications when possible.' },
  { drug1: 'oxycodone', drug2: 'diazepam', severity: 'major', description: 'Combining opioids with benzodiazepines may cause dangerous sedation and breathing problems.', info: 'FDA warns against combining these medications when possible.' },
  { drug1: 'oxycodone', drug2: 'lorazepam', severity: 'major', description: 'Combining opioids with benzodiazepines may cause dangerous sedation and breathing problems.', info: 'FDA warns against combining these medications when possible.' },
  { drug1: 'oxycodone', drug2: 'clonazepam', severity: 'major', description: 'Combining opioids with benzodiazepines may cause dangerous sedation and breathing problems.', info: 'FDA warns against combining these medications when possible.' },
  { drug1: 'oxycodone', drug2: 'gabapentin', severity: 'major', description: 'Gabapentin with opioids may increase sedation and respiratory depression risk.', info: 'Use lowest effective doses and monitor closely.' },
  { drug1: 'oxycodone', drug2: 'pregabalin', severity: 'major', description: 'Pregabalin with opioids may increase sedation and respiratory depression risk.', info: 'Use lowest effective doses and monitor closely.' },
  { drug1: 'hydrocodone', drug2: 'alprazolam', severity: 'major', description: 'Combining opioids with benzodiazepines may cause dangerous sedation and breathing problems.', info: 'FDA warns against combining these medications when possible.' },
  { drug1: 'hydrocodone', drug2: 'diazepam', severity: 'major', description: 'Combining opioids with benzodiazepines may cause dangerous sedation and breathing problems.', info: 'FDA warns against combining these medications when possible.' },
  { drug1: 'hydrocodone', drug2: 'lorazepam', severity: 'major', description: 'Combining opioids with benzodiazepines may cause dangerous sedation and breathing problems.', info: 'FDA warns against combining these medications when possible.' },
  { drug1: 'hydrocodone', drug2: 'clonazepam', severity: 'major', description: 'Combining opioids with benzodiazepines may cause dangerous sedation and breathing problems.', info: 'FDA warns against combining these medications when possible.' },
  { drug1: 'hydrocodone', drug2: 'gabapentin', severity: 'major', description: 'Gabapentin with opioids may increase sedation and respiratory depression risk.', info: 'Use lowest effective doses and monitor closely.' },
  { drug1: 'morphine', drug2: 'alprazolam', severity: 'major', description: 'Combining opioids with benzodiazepines may cause dangerous sedation and breathing problems.', info: 'FDA warns against combining these medications when possible.' },
  { drug1: 'morphine', drug2: 'diazepam', severity: 'major', description: 'Combining opioids with benzodiazepines may cause dangerous sedation and breathing problems.', info: 'FDA warns against combining these medications when possible.' },
  { drug1: 'morphine', drug2: 'lorazepam', severity: 'major', description: 'Combining opioids with benzodiazepines may cause dangerous sedation and breathing problems.', info: 'FDA warns against combining these medications when possible.' },
  { drug1: 'morphine', drug2: 'gabapentin', severity: 'major', description: 'Gabapentin with opioids may increase sedation and respiratory depression risk.', info: 'Use lowest effective doses and monitor closely.' },
  { drug1: 'codeine', drug2: 'alprazolam', severity: 'major', description: 'Combining opioids with benzodiazepines may cause dangerous sedation.', info: 'FDA warns against combining these medications when possible.' },
  { drug1: 'codeine', drug2: 'diazepam', severity: 'major', description: 'Combining opioids with benzodiazepines may cause dangerous sedation.', info: 'FDA warns against combining these medications when possible.' },
  { drug1: 'fentanyl', drug2: 'alprazolam', severity: 'major', description: 'Combining opioids with benzodiazepines may cause fatal respiratory depression.', info: 'This combination carries extreme risk. FDA strongly warns against it.' },
  { drug1: 'fentanyl', drug2: 'diazepam', severity: 'major', description: 'Combining opioids with benzodiazepines may cause fatal respiratory depression.', info: 'This combination carries extreme risk. FDA strongly warns against it.' },
  { drug1: 'fentanyl', drug2: 'gabapentin', severity: 'major', description: 'Gabapentin with opioids may increase sedation and respiratory depression risk.', info: 'Use lowest effective doses and monitor closely.' },
  { drug1: 'tramadol', drug2: 'alprazolam', severity: 'major', description: 'Combining tramadol with benzodiazepines may cause dangerous sedation.', info: 'FDA warns against combining these medications when possible.' },
  { drug1: 'tramadol', drug2: 'diazepam', severity: 'major', description: 'Combining tramadol with benzodiazepines may cause dangerous sedation.', info: 'FDA warns against combining these medications when possible.' },
  { drug1: 'tramadol', drug2: 'carbamazepine', severity: 'major', description: 'Carbamazepine may reduce tramadol effectiveness and increase seizure risk.', info: 'This combination should generally be avoided.' },

  // ── Antibiotic interactions ──
  { drug1: 'ciprofloxacin', drug2: 'tizanidine', severity: 'major', description: 'Ciprofloxacin may dramatically increase tizanidine levels, causing severe low blood pressure.', info: 'This combination should be avoided.' },
  { drug1: 'ciprofloxacin', drug2: 'theophylline', severity: 'major', description: 'Ciprofloxacin may increase theophylline levels to toxic range.', info: 'Theophylline levels should be monitored closely.' },
  { drug1: 'ciprofloxacin', drug2: 'warfarin', severity: 'major', description: 'Ciprofloxacin may increase warfarin effect and bleeding risk.', info: 'INR should be monitored closely during antibiotic treatment.' },
  { drug1: 'ciprofloxacin', drug2: 'calcium', severity: 'moderate', description: 'Calcium may reduce ciprofloxacin absorption.', info: 'Take ciprofloxacin at least 2 hours before or 6 hours after calcium.' },
  { drug1: 'ciprofloxacin', drug2: 'iron', severity: 'moderate', description: 'Iron may reduce ciprofloxacin absorption.', info: 'Take ciprofloxacin at least 2 hours before or 6 hours after iron.' },
  { drug1: 'ciprofloxacin', drug2: 'antacid', severity: 'moderate', description: 'Antacids may reduce ciprofloxacin absorption.', info: 'Take ciprofloxacin at least 2 hours before or 6 hours after antacids.' },
  { drug1: 'levofloxacin', drug2: 'warfarin', severity: 'major', description: 'Levofloxacin may increase warfarin effect and bleeding risk.', info: 'INR should be monitored closely during antibiotic treatment.' },
  { drug1: 'levofloxacin', drug2: 'calcium', severity: 'moderate', description: 'Calcium may reduce levofloxacin absorption.', info: 'Take levofloxacin at least 2 hours before or 2 hours after calcium.' },
  { drug1: 'levofloxacin', drug2: 'iron', severity: 'moderate', description: 'Iron may reduce levofloxacin absorption.', info: 'Take levofloxacin at least 2 hours before or 2 hours after iron.' },
  { drug1: 'metronidazole', drug2: 'alcohol', severity: 'major', description: 'Alcohol with metronidazole may cause severe nausea, vomiting, and flushing.', info: 'Avoid all alcohol during treatment and for 3 days after.' },
  { drug1: 'metronidazole', drug2: 'lithium', severity: 'major', description: 'Metronidazole may increase lithium levels to toxic range.', info: 'Lithium levels should be monitored closely during treatment.' },
  { drug1: 'azithromycin', drug2: 'amiodarone', severity: 'major', description: 'Both may prolong QT interval, increasing risk of dangerous heart rhythms.', info: 'This combination should be avoided. Discuss alternatives with your provider.' },
  { drug1: 'azithromycin', drug2: 'digoxin', severity: 'moderate', description: 'Azithromycin may increase digoxin levels.', info: 'Digoxin levels should be monitored during antibiotic treatment.' },
  { drug1: 'clarithromycin', drug2: 'digoxin', severity: 'major', description: 'Clarithromycin may significantly increase digoxin levels.', info: 'Digoxin levels should be monitored closely.' },
  { drug1: 'clarithromycin', drug2: 'colchicine', severity: 'major', description: 'Clarithromycin may increase colchicine to toxic levels.', info: 'This combination can be fatal. Dose reduction or avoidance required.' },
  { drug1: 'erythromycin', drug2: 'digoxin', severity: 'major', description: 'Erythromycin may increase digoxin levels.', info: 'Digoxin levels should be monitored closely.' },
  { drug1: 'fluconazole', drug2: 'clopidogrel', severity: 'moderate', description: 'Fluconazole may reduce clopidogrel effectiveness.', info: 'Discuss alternative antifungal options with your provider.' },

  // ── Thyroid interactions ──
  { drug1: 'levothyroxine', drug2: 'calcium', severity: 'moderate', description: 'Calcium may reduce levothyroxine absorption.', info: 'Take levothyroxine at least 4 hours apart from calcium supplements.' },
  { drug1: 'levothyroxine', drug2: 'omeprazole', severity: 'moderate', description: 'Omeprazole may reduce levothyroxine absorption.', info: 'Thyroid levels may need monitoring when starting omeprazole.' },
  { drug1: 'levothyroxine', drug2: 'iron', severity: 'moderate', description: 'Iron supplements may reduce levothyroxine absorption.', info: 'Take levothyroxine at least 4 hours apart from iron supplements.' },
  { drug1: 'levothyroxine', drug2: 'aluminum', severity: 'moderate', description: 'Aluminum-containing antacids may reduce levothyroxine absorption.', info: 'Take levothyroxine at least 4 hours apart from antacids.' },
  { drug1: 'levothyroxine', drug2: 'sucralfate', severity: 'moderate', description: 'Sucralfate may reduce levothyroxine absorption.', info: 'Take levothyroxine at least 4 hours apart from sucralfate.' },
  { drug1: 'levothyroxine', drug2: 'warfarin', severity: 'moderate', description: 'Levothyroxine may increase warfarin effect.', info: 'INR should be monitored when adjusting thyroid dose.' },
  { drug1: 'levothyroxine', drug2: 'cholestyramine', severity: 'moderate', description: 'Cholestyramine may reduce levothyroxine absorption.', info: 'Take levothyroxine at least 4 hours apart from cholestyramine.' },

  // ── Seizure / epilepsy medication interactions ──
  { drug1: 'carbamazepine', drug2: 'phenytoin', severity: 'major', description: 'Complex interaction — each may alter the other\'s levels.', info: 'Both drug levels should be monitored closely.' },
  { drug1: 'carbamazepine', drug2: 'valproic acid', severity: 'major', description: 'Carbamazepine may decrease valproic acid levels.', info: 'Both drug levels should be monitored closely.' },
  { drug1: 'carbamazepine', drug2: 'oral contraceptive', severity: 'major', description: 'Carbamazepine may reduce birth control effectiveness.', info: 'A backup or alternative birth control method should be used.' },
  { drug1: 'carbamazepine', drug2: 'doxycycline', severity: 'moderate', description: 'Carbamazepine may reduce doxycycline effectiveness.', info: 'A longer course or alternative antibiotic may be needed.' },
  { drug1: 'carbamazepine', drug2: 'erythromycin', severity: 'major', description: 'Erythromycin may increase carbamazepine to toxic levels.', info: 'Carbamazepine levels should be monitored. Consider alternative antibiotic.' },
  { drug1: 'carbamazepine', drug2: 'fluoxetine', severity: 'moderate', description: 'Fluoxetine may increase carbamazepine levels.', info: 'Carbamazepine levels should be monitored.' },
  { drug1: 'phenytoin', drug2: 'valproic acid', severity: 'major', description: 'Complex interaction — each may alter the other\'s levels.', info: 'Both drug levels should be monitored closely.' },
  { drug1: 'phenytoin', drug2: 'oral contraceptive', severity: 'major', description: 'Phenytoin may reduce birth control effectiveness.', info: 'A backup or alternative birth control method should be used.' },
  { drug1: 'phenytoin', drug2: 'fluconazole', severity: 'major', description: 'Fluconazole may increase phenytoin levels to toxic range.', info: 'Phenytoin levels should be monitored closely.' },
  { drug1: 'phenytoin', drug2: 'omeprazole', severity: 'moderate', description: 'Omeprazole may increase phenytoin levels.', info: 'Phenytoin levels should be monitored when starting omeprazole.' },
  { drug1: 'valproic acid', drug2: 'lamotrigine', severity: 'major', description: 'Valproic acid may double lamotrigine levels, increasing toxicity risk.', info: 'Lamotrigine dose must be reduced when taken with valproic acid.' },
  { drug1: 'valproic acid', drug2: 'aspirin', severity: 'major', description: 'Aspirin may increase free valproic acid levels.', info: 'This combination should be used with caution. Monitor for toxicity.' },
  { drug1: 'lamotrigine', drug2: 'oral contraceptive', severity: 'moderate', description: 'Birth control pills may decrease lamotrigine levels.', info: 'Lamotrigine levels and seizure control should be monitored.' },

  // ── Lithium interactions ──
  { drug1: 'lithium', drug2: 'ibuprofen', severity: 'major', description: 'NSAIDs may increase lithium levels to toxic range.', info: 'Lithium levels should be monitored. Consider acetaminophen instead.' },
  { drug1: 'lithium', drug2: 'naproxen', severity: 'major', description: 'NSAIDs may increase lithium levels to toxic range.', info: 'Lithium levels should be monitored. Consider acetaminophen instead.' },
  { drug1: 'lithium', drug2: 'hydrochlorothiazide', severity: 'major', description: 'Thiazide diuretics may increase lithium levels significantly.', info: 'Lithium levels must be monitored closely. Dose adjustment likely needed.' },
  { drug1: 'lithium', drug2: 'furosemide', severity: 'major', description: 'Furosemide may increase lithium levels.', info: 'Lithium levels should be monitored closely.' },
  { drug1: 'lithium', drug2: 'lisinopril', severity: 'major', description: 'ACE inhibitors may increase lithium levels to toxic range.', info: 'Lithium levels should be monitored closely.' },
  { drug1: 'lithium', drug2: 'carbamazepine', severity: 'major', description: 'May increase neurotoxicity without changing lithium levels.', info: 'Watch for confusion, dizziness, tremor, or unsteady gait.' },

  // ── Corticosteroid interactions ──
  { drug1: 'prednisone', drug2: 'ibuprofen', severity: 'moderate', description: 'Combining corticosteroids with NSAIDs increases GI bleeding risk.', info: 'Discuss stomach protection with your provider.' },
  { drug1: 'prednisone', drug2: 'naproxen', severity: 'moderate', description: 'Combining corticosteroids with NSAIDs increases GI bleeding risk.', info: 'Discuss stomach protection with your provider.' },
  { drug1: 'prednisone', drug2: 'aspirin', severity: 'moderate', description: 'Combining corticosteroids with aspirin increases GI bleeding risk.', info: 'Discuss stomach protection with your provider.' },
  { drug1: 'prednisone', drug2: 'warfarin', severity: 'moderate', description: 'Prednisone may affect warfarin levels and bleeding risk.', info: 'INR should be monitored when starting or stopping prednisone.' },
  { drug1: 'prednisone', drug2: 'insulin', severity: 'moderate', description: 'Corticosteroids may raise blood sugar, reducing insulin effectiveness.', info: 'Blood sugar should be monitored closely. Insulin dose may need adjustment.' },
  { drug1: 'prednisone', drug2: 'metformin', severity: 'moderate', description: 'Corticosteroids may raise blood sugar, reducing metformin effectiveness.', info: 'Blood sugar should be monitored closely.' },
  { drug1: 'dexamethasone', drug2: 'warfarin', severity: 'moderate', description: 'Dexamethasone may affect warfarin levels.', info: 'INR should be monitored closely.' },
  { drug1: 'dexamethasone', drug2: 'phenytoin', severity: 'moderate', description: 'Phenytoin may decrease dexamethasone effectiveness.', info: 'Higher corticosteroid doses may be needed.' },

  // ── Immunosuppressant interactions ──
  { drug1: 'cyclosporine', drug2: 'ketoconazole', severity: 'major', description: 'Ketoconazole may significantly increase cyclosporine levels.', info: 'Cyclosporine levels must be monitored closely.' },
  { drug1: 'cyclosporine', drug2: 'erythromycin', severity: 'major', description: 'Erythromycin may increase cyclosporine levels.', info: 'Cyclosporine levels should be monitored during antibiotic treatment.' },
  { drug1: 'cyclosporine', drug2: 'potassium', severity: 'major', description: 'Cyclosporine may increase potassium levels.', info: 'Avoid potassium supplements unless directed by your provider.' },
  { drug1: 'tacrolimus', drug2: 'ketoconazole', severity: 'major', description: 'Ketoconazole may significantly increase tacrolimus levels.', info: 'Tacrolimus levels must be monitored closely.' },
  { drug1: 'tacrolimus', drug2: 'erythromycin', severity: 'major', description: 'Erythromycin may increase tacrolimus levels.', info: 'Tacrolimus levels should be monitored closely.' },
  { drug1: 'tacrolimus', drug2: 'ibuprofen', severity: 'major', description: 'NSAIDs may increase risk of kidney damage with tacrolimus.', info: 'Kidney function should be monitored. Discuss alternative pain relief.' },
  { drug1: 'methotrexate', drug2: 'ibuprofen', severity: 'major', description: 'NSAIDs may increase methotrexate levels and toxicity risk.', info: 'This combination should be used with extreme caution.' },
  { drug1: 'methotrexate', drug2: 'naproxen', severity: 'major', description: 'NSAIDs may increase methotrexate levels and toxicity risk.', info: 'This combination should be used with extreme caution.' },
  { drug1: 'methotrexate', drug2: 'trimethoprim', severity: 'major', description: 'Trimethoprim may increase methotrexate toxicity.', info: 'This combination should be avoided when possible.' },
  { drug1: 'methotrexate', drug2: 'omeprazole', severity: 'moderate', description: 'Omeprazole may increase methotrexate levels.', info: 'Consider temporarily stopping omeprazole during high-dose methotrexate.' },

  // ── Psychiatric / antipsychotic interactions ──
  { drug1: 'quetiapine', drug2: 'ketoconazole', severity: 'major', description: 'Ketoconazole may significantly increase quetiapine levels.', info: 'Quetiapine dose should be reduced. Consult your provider.' },
  { drug1: 'quetiapine', drug2: 'erythromycin', severity: 'major', description: 'Erythromycin may increase quetiapine levels.', info: 'Caution is advised. Your provider may adjust the dose.' },
  { drug1: 'quetiapine', drug2: 'carbamazepine', severity: 'major', description: 'Carbamazepine may significantly decrease quetiapine levels.', info: 'Higher quetiapine doses may be needed.' },
  { drug1: 'haloperidol', drug2: 'carbamazepine', severity: 'moderate', description: 'Carbamazepine may decrease haloperidol levels.', info: 'Haloperidol dose may need adjustment.' },
  { drug1: 'clozapine', drug2: 'ciprofloxacin', severity: 'major', description: 'Ciprofloxacin may significantly increase clozapine levels.', info: 'Clozapine levels should be monitored. Dose reduction may be needed.' },
  { drug1: 'clozapine', drug2: 'carbamazepine', severity: 'major', description: 'Carbamazepine may reduce clozapine levels and increase bone marrow suppression risk.', info: 'This combination should generally be avoided.' },
  { drug1: 'aripiprazole', drug2: 'fluoxetine', severity: 'moderate', description: 'Fluoxetine may increase aripiprazole levels.', info: 'Aripiprazole dose may need to be reduced.' },
  { drug1: 'aripiprazole', drug2: 'carbamazepine', severity: 'moderate', description: 'Carbamazepine may decrease aripiprazole levels.', info: 'Higher aripiprazole doses may be needed.' },

  // ── Miscellaneous high-priority interactions ──
  { drug1: 'potassium', drug2: 'spironolactone', severity: 'major', description: 'Spironolactone retains potassium — supplements may cause dangerous levels.', info: 'Do not take potassium supplements with spironolactone unless directed.' },
  { drug1: 'sildenafil', drug2: 'alpha blocker', severity: 'moderate', description: 'Combining may cause significant blood pressure drop.', info: 'Start with lowest sildenafil dose if taking an alpha blocker.' },
  { drug1: 'sildenafil', drug2: 'tamsulosin', severity: 'moderate', description: 'Combining may cause significant blood pressure drop.', info: 'Use caution and start with lowest doses.' },
  { drug1: 'colchicine', drug2: 'cyclosporine', severity: 'major', description: 'Cyclosporine may increase colchicine to toxic levels.', info: 'This combination requires dose adjustment and close monitoring.' },
  { drug1: 'colchicine', drug2: 'ketoconazole', severity: 'major', description: 'Ketoconazole may increase colchicine to toxic levels.', info: 'Colchicine dose must be reduced significantly.' },
  { drug1: 'allopurinol', drug2: 'azathioprine', severity: 'major', description: 'Allopurinol may greatly increase azathioprine levels, causing severe toxicity.', info: 'Azathioprine dose must be reduced by 60-75% if used together.' },
  { drug1: 'allopurinol', drug2: 'mercaptopurine', severity: 'major', description: 'Allopurinol may greatly increase mercaptopurine levels.', info: 'Mercaptopurine dose must be significantly reduced.' },
  { drug1: 'theophylline', drug2: 'erythromycin', severity: 'major', description: 'Erythromycin may increase theophylline to toxic levels.', info: 'Theophylline levels should be monitored closely.' },
  { drug1: 'theophylline', drug2: 'cimetidine', severity: 'major', description: 'Cimetidine may increase theophylline levels.', info: 'Consider ranitidine or famotidine as alternatives.' },
];

// ─── OpenFDA label-based interaction checking ────────────────────────────────

const fdaCache: Record<string, string[]> = {};

async function getFDAInteractionDrugs(drugName: string): Promise<string[]> {
  const key = drugName.toLowerCase();
  if (fdaCache[key]) return fdaCache[key];

  try {
    const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(drugName)}"&limit=1`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data: any = await response.json();
    const label = data.results?.[0];
    const interactionText = label?.drug_interactions?.[0] || '';

    if (!interactionText) return [];

    // Extract drug names mentioned in the interaction text
    const mentionedDrugs: string[] = [];
    const commonDrugs = [
      // Anticoagulants / antiplatelets
      'warfarin', 'aspirin', 'clopidogrel', 'rivaroxaban', 'apixaban', 'dabigatran',
      // NSAIDs
      'ibuprofen', 'naproxen', 'acetaminophen', 'celecoxib', 'meloxicam', 'diclofenac', 'indomethacin',
      // Diabetes
      'metformin', 'insulin', 'glipizide', 'glyburide', 'pioglitazone', 'dapagliflozin', 'empagliflozin', 'sitagliptin', 'liraglutide', 'semaglutide',
      // Blood pressure - ACE/ARB
      'lisinopril', 'enalapril', 'ramipril', 'losartan', 'valsartan', 'irbesartan', 'olmesartan', 'aliskiren',
      // Blood pressure - calcium channel blockers
      'amlodipine', 'verapamil', 'diltiazem', 'nifedipine',
      // Beta blockers
      'metoprolol', 'atenolol', 'propranolol', 'carvedilol', 'bisoprolol', 'nebivolol',
      // Statins
      'simvastatin', 'atorvastatin', 'rosuvastatin', 'lovastatin', 'pravastatin', 'fluvastatin',
      // PPIs / GI
      'omeprazole', 'pantoprazole', 'esomeprazole', 'lansoprazole', 'ranitidine', 'famotidine', 'cimetidine', 'sucralfate',
      // SSRIs / SNRIs / antidepressants
      'sertraline', 'fluoxetine', 'paroxetine', 'citalopram', 'escitalopram', 'duloxetine', 'venlafaxine', 'bupropion', 'trazodone', 'mirtazapine',
      // Antipsychotics
      'quetiapine', 'risperidone', 'olanzapine', 'aripiprazole', 'haloperidol', 'clozapine',
      // Cardiac
      'amiodarone', 'digoxin', 'nitroglycerin', 'isosorbide', 'clonidine',
      // Diuretics
      'furosemide', 'hydrochlorothiazide', 'spironolactone', 'chlorthalidone', 'triamterene',
      // Benzodiazepines
      'alprazolam', 'diazepam', 'lorazepam', 'clonazepam', 'midazolam',
      // Opioids
      'oxycodone', 'hydrocodone', 'tramadol', 'morphine', 'codeine', 'fentanyl', 'methadone', 'buprenorphine',
      // Seizure / mood stabilizers
      'gabapentin', 'pregabalin', 'carbamazepine', 'phenytoin', 'valproic acid', 'lamotrigine', 'topiramate', 'levetiracetam',
      // Antibiotics
      'ciprofloxacin', 'levofloxacin', 'moxifloxacin', 'azithromycin', 'amoxicillin', 'doxycycline',
      'clarithromycin', 'erythromycin', 'metronidazole', 'sulfamethoxazole', 'trimethoprim', 'nitrofurantoin', 'rifampin', 'linezolid',
      // Antifungals
      'fluconazole', 'ketoconazole', 'itraconazole', 'voriconazole',
      // Steroids
      'prednisone', 'prednisolone', 'dexamethasone', 'methylprednisolone',
      // Immunosuppressants
      'cyclosporine', 'tacrolimus', 'methotrexate', 'azathioprine', 'mycophenolate',
      // Thyroid / endocrine
      'levothyroxine',
      // Psychiatric / other CNS
      'lithium', 'buspirone',
      // Pulmonary
      'theophylline', 'montelukast',
      // Erectile dysfunction
      'sildenafil', 'tadalafil',
      // Gout
      'colchicine', 'allopurinol',
      // Other
      'sumatriptan', 'tizanidine', 'tamoxifen', 'tamsulosin', 'finasteride', 'cholestyramine',
      'gemfibrozil', 'mercaptopurine',
    ];

    const lowerText = interactionText.toLowerCase();
    for (const drug of commonDrugs) {
      if (drug !== key && lowerText.includes(drug)) {
        mentionedDrugs.push(drug);
      }
    }

    fdaCache[key] = mentionedDrugs;
    return mentionedDrugs;
  } catch (error) {
    console.error('OpenFDA lookup error for', drugName, ':', error);
    return [];
  }
}

// ─── Main interaction checking logic ─────────────────────────────────────────

export async function checkInteractions(medications: Medication[]): Promise<Interaction[]> {
  const interactions: Interaction[] = [];
  const foundPairs = new Set<string>();

  const pairKey = (a: string, b: string) => [a, b].sort().join('|||').toLowerCase();

  // 1. Check local offline database first (instant, no network needed)
  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const name1 = medications[i].name.toLowerCase();
      const name2 = medications[j].name.toLowerCase();

      for (const interaction of CRITICAL_INTERACTIONS) {
        const match1 = name1.includes(interaction.drug1) && name2.includes(interaction.drug2);
        const match2 = name1.includes(interaction.drug2) && name2.includes(interaction.drug1);
        if (match1 || match2) {
          const key = pairKey(medications[i].name, medications[j].name);
          if (!foundPairs.has(key)) {
            foundPairs.add(key);
            interactions.push({
              med1: medications[i].name,
              med2: medications[j].name,
              severity: interaction.severity,
              description: interaction.description,
              info: interaction.info,
              source: 'reference_database',
            });
          }
        }
      }
    }
  }

  // 2. Check OpenFDA labels for additional interactions not in offline DB
  try {
    for (let i = 0; i < medications.length; i++) {
      const mentionedDrugs = await getFDAInteractionDrugs(medications[i].name);

      for (let j = 0; j < medications.length; j++) {
        if (i === j) continue;
        const key = pairKey(medications[i].name, medications[j].name);
        if (foundPairs.has(key)) continue;

        const otherName = medications[j].name.toLowerCase();
        if (mentionedDrugs.some((d) => otherName.includes(d) || d.includes(otherName))) {
          foundPairs.add(key);
          interactions.push({
            med1: medications[i].name,
            med2: medications[j].name,
            severity: 'moderate',
            description: `FDA labeling for ${medications[i].name} mentions a potential interaction with ${medications[j].name}.`,
            info: 'Review the full drug label or ask your pharmacist for details about this interaction.',
            source: 'openfda',
          });
        }
      }
    }
  } catch (error) {
    console.error('OpenFDA interaction checking error:', error);
  }

  return interactions;
}

// ─── Drug class cross-reactivity mapping ────────────────────────────────────
// If patient is allergic to one member of a drug class, flag related drugs too.

const DRUG_CLASS_FAMILIES: Record<string, string[]> = {
  penicillin: ['penicillin', 'amoxicillin', 'ampicillin', 'augmentin', 'amoxicillin/clavulanate', 'piperacillin', 'nafcillin', 'oxacillin', 'dicloxacillin'],
  cephalosporin: ['cephalexin', 'cefazolin', 'ceftriaxone', 'cefdinir', 'cefuroxime', 'cefepime', 'ceftazidime', 'cefpodoxime'],
  sulfa: ['sulfamethoxazole', 'trimethoprim/sulfamethoxazole', 'bactrim', 'sulfasalazine'],
  fluoroquinolone: ['ciprofloxacin', 'levofloxacin', 'moxifloxacin', 'ofloxacin'],
  nsaid: ['ibuprofen', 'naproxen', 'aspirin', 'celecoxib', 'meloxicam', 'diclofenac', 'indomethacin', 'ketorolac'],
  statin: ['atorvastatin', 'simvastatin', 'rosuvastatin', 'lovastatin', 'pravastatin', 'fluvastatin'],
  ace_inhibitor: ['lisinopril', 'enalapril', 'ramipril', 'benazepril', 'captopril', 'quinapril', 'fosinopril'],
  arb: ['losartan', 'valsartan', 'irbesartan', 'olmesartan', 'candesartan', 'telmisartan'],
  opioid: ['oxycodone', 'hydrocodone', 'morphine', 'codeine', 'tramadol', 'fentanyl', 'methadone', 'hydromorphone'],
  benzodiazepine: ['alprazolam', 'diazepam', 'lorazepam', 'clonazepam', 'midazolam', 'temazepam'],
  ssri: ['sertraline', 'fluoxetine', 'paroxetine', 'citalopram', 'escitalopram'],
};

// Note: penicillin allergy has ~1-2% cross-reactivity with cephalosporins
const CROSS_REACTIVE_CLASSES: [string, string][] = [
  ['penicillin', 'cephalosporin'],
];

function getDrugFamily(drugName: string): string | null {
  const lower = drugName.toLowerCase();
  for (const [family, members] of Object.entries(DRUG_CLASS_FAMILIES)) {
    if (members.some((m) => lower.includes(m) || m.includes(lower))) {
      return family;
    }
  }
  return null;
}

function getRelatedDrugs(drugName: string): string[] {
  const family = getDrugFamily(drugName);
  if (!family) return [];

  const related: string[] = [];

  // Same-family drugs
  for (const member of DRUG_CLASS_FAMILIES[family]) {
    if (member !== drugName.toLowerCase()) {
      related.push(member);
    }
  }

  // Cross-reactive class drugs
  for (const [classA, classB] of CROSS_REACTIVE_CLASSES) {
    if (family === classA) {
      related.push(...DRUG_CLASS_FAMILIES[classB]);
    } else if (family === classB) {
      related.push(...DRUG_CLASS_FAMILIES[classA]);
    }
  }

  return related;
}

// ─── Allergy conflict checking ───────────────────────────────────────────────

export function checkAllergyConflicts(medications: Medication[], allergies: Allergy[]): AllergyConflict[] {
  const conflicts: AllergyConflict[] = [];
  const found = new Set<string>();

  for (const med of medications) {
    for (const allergy of allergies) {
      const medName = med.name.toLowerCase();
      const allergyName = allergy.name.toLowerCase();
      const key = `${medName}|||${allergyName}`;

      // 1. Direct name match (existing behavior)
      if (medName.includes(allergyName) || allergyName.includes(medName)) {
        if (!found.has(key)) {
          found.add(key);
          conflicts.push({ medication: med.name, allergy: allergy.name });
        }
        continue;
      }

      // 2. Drug class cross-reactivity (e.g., penicillin allergy → flag amoxicillin)
      const relatedDrugs = getRelatedDrugs(allergy.name);
      if (relatedDrugs.some((r) => medName.includes(r) || r.includes(medName))) {
        if (!found.has(key)) {
          found.add(key);
          const allergyFamily = getDrugFamily(allergy.name);
          const medFamily = getDrugFamily(med.name);
          const isCrossClass = allergyFamily !== medFamily;
          conflicts.push({
            medication: med.name,
            allergy: isCrossClass
              ? `${allergy.name} (cross-reactivity)`
              : `${allergy.name} (same drug class)`,
          });
        }
      }
    }
  }

  // 3. Check if allergen drugs have known interactions with current meds
  //    e.g., allergic to amoxicillin → amoxicillin interacts with warfarin → flag it
  for (const allergy of allergies) {
    const allergyLower = allergy.name.toLowerCase();
    for (const med of medications) {
      const medLower = med.name.toLowerCase();
      const key = `interaction_${medLower}|||${allergyLower}`;
      if (found.has(key)) continue;

      // Check if the allergen drug has a known interaction with this medication
      for (const interaction of CRITICAL_INTERACTIONS) {
        const matchA = allergyLower.includes(interaction.drug1) && medLower.includes(interaction.drug2);
        const matchB = allergyLower.includes(interaction.drug2) && medLower.includes(interaction.drug1);
        if (matchA || matchB) {
          found.add(key);
          conflicts.push({
            medication: med.name,
            allergy: `${allergy.name} (known interaction: ${interaction.description})`,
          });
          break;
        }
      }
    }
  }

  return conflicts;
}

// ─── Refill reminder checking ────────────────────────────────────────────────

export function checkRefillReminders(medications: Medication[]): RefillStatus {
  const upcoming: RefillStatus['upcoming'] = [];
  const overdue: RefillStatus['overdue'] = [];

  for (const med of medications) {
    if (med.refillDate) {
      const daysUntil = Math.ceil((new Date(med.refillDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) {
        overdue.push({ ...med, daysOverdue: Math.abs(daysUntil) });
      } else if (daysUntil <= 7) {
        upcoming.push({ ...med, daysUntil });
      }
    }
  }

  return { upcoming, overdue };
}
