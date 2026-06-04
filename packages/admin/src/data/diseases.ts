export interface Disease {
  id: string
  name: string
  aliases: string[]
  crops: string[]
  type: 'fungus' | 'virus' | 'bacteria' | 'insect' | 'mite' | 'nematode' | 'deficiency' | 'physiological' | 'weed'
  symptoms: string[]
  causes: string[]
  spread: string
  favorable_conditions: string[]
  chemical_control: string[]
  biological_control: string[]
  prevention: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  regions: string[]
  season: string[]
  image_hint: string
}

export const DISEASE_DATABASE: Disease[] = [
  // ===== TOMATO =====
  {
    id: 'tomato-early-blight', name: 'Early Blight',
    aliases: ['Target Spot', 'Alternaria Blight'],
    crops: ['Tomato', 'Potato', 'Eggplant'],
    type: 'fungus',
    symptoms: ['Dark brown spots with concentric rings on lower leaves', 'Yellowing of leaves around spots', 'Defoliation starting from bottom', 'Sunken lesions on stems', 'Dark spots on fruit near calyx'],
    causes: ['Alternaria solani fungus', 'Infected seeds or transplants', 'Infected plant debris in soil'],
    spread: 'Wind, rain splash, contaminated tools, infected seeds',
    favorable_conditions: ['Warm humid weather (24-30°C)', 'High rainfall', 'Extended leaf wetness periods', 'Poor air circulation', 'Overhead irrigation'],
    chemical_control: ['Chlorothalonil 2g/L water', 'Mancozeb 2g/L',  'Azoxystrobin 1ml/L', 'Difenoconazole 0.5ml/L', 'Apply at 7-10 day intervals'],
    biological_control: ['Neem oil 5ml/L', 'Trichoderma viride 5g/L', 'Bacillus subtilis spray', 'Copper oxychloride 3g/L', 'Baking soda solution 5g/L'],
    prevention: ['Use disease-free seeds', 'Practice 3-year crop rotation', 'Mulch around plants', 'Remove lower infected leaves',  'Water at base, avoid overhead', 'Space plants for air circulation'],
    severity: 'high', regions: ['India', 'Global', 'Tropical', 'Subtropical'], season: ['Kharif', 'Rabi'], image_hint: 'Brown concentric rings on lower leaves, yellow halo'
  },
  {
    id: 'tomato-late-blight', name: 'Late Blight',
    aliases: ['Potato Blight', 'Tomato Blight'],
    crops: ['Tomato', 'Potato'],
    type: 'fungus',
    symptoms: ['Water-soaked lesions on leaves turning brown/black', 'White fuzzy growth on leaf undersides in wet weather', 'Dark firm lesions on stems', 'Brown greasy spots on green fruit', 'Rapid wilting and collapse of entire plant'],
    causes: ['Phytophthora infestans (oomycete)', 'Infected potato tubers nearby', 'Surviving spores in soil or plant debris'],
    spread: 'Wind-borne spores, rain splash, infected tubers, can travel 30+ miles in wind',
    favorable_conditions: ['Cool wet weather (10-20°C)', 'High humidity >90%', 'Frequent rain or heavy dew', 'Dense plant canopy'],
    chemical_control: ['Metalaxyl-M + Mancozeb 2g/L', 'Cymoxanil + Mancozeb 2g/L', 'Dimethomorph 0.5g/L', 'Copper oxychloride 3g/L', 'Apply preventatively before infection'],
    biological_control: ['Bacillus subtilis foliar spray', 'Compost tea spray', 'Garlic extract 10ml/L', 'Neem oil 5ml/L'],
    prevention: ['Use resistant varieties like Arka Samrat', 'Destroy volunteers and cull piles', 'Avoid overhead irrigation', 'Space widely for good airflow', 'Scout frequently in cool wet weather', 'Remove and destroy infected plants immediately'],
    severity: 'critical', regions: ['India', 'Global', 'Cool humid regions'], season: ['Rabi', 'Winter'], image_hint: 'Water-soaked leaf lesions with white fuzzy undersides'
  },
  {
    id: 'tomato-leaf-curl', name: 'Tomato Leaf Curl Virus',
    aliases: ['TLCV', 'Tomato Yellow Leaf Curl Virus', 'TYLCV'],
    crops: ['Tomato', 'Capsicum', 'Chili'],
    type: 'virus',
    symptoms: ['Yellowing and upward curling of leaves', 'Severe stunting of plant growth', 'Reduced leaf size (leaflets become small)', 'Flower drop and poor fruit set', 'Fruits are small and unmarketable'],
    causes: ['Tomato Yellow Leaf Curl Virus (TYLCV)', 'Transmitted by whitefly (Bemisia tabaci)', 'Infected weeds act as reservoir hosts'],
    spread: 'Whitefly vector - acquires virus in 15-30 min, transmits for life. Not seed-transmitted.',
    favorable_conditions: ['Hot dry weather (30-40°C)', 'High whitefly populations', 'Dry conditions favor whitefly', 'Presence of weed hosts nearby'],
    chemical_control: ['Imidacloprid 0.5ml/L for whitefly control', 'Buprofezin 1ml/L', 'Diafenthiuron 0.5g/L', 'Apply insecticides primarily for vector control'],
    biological_control: ['Yellow sticky traps for whitefly monitoring', 'Neem oil 5ml/L repels whiteflies', 'Encourage natural predators: ladybugs, lacewings', 'Reflective mulch repels whiteflies'],
    prevention: ['Use resistant/hybrid varieties', 'Whitefly-proof netting in nurseries', 'Remove infected plants immediately', 'Control weed hosts', 'Plant barrier crops (maize/sorghum) around field', 'Avoid transplanting near older infected fields'],
    severity: 'critical', regions: ['India', 'Middle East', 'Mediterranean', 'Africa', 'Southeast Asia'], season: ['Kharif', 'Summer'], image_hint: 'Yellow curled upward leaves, stunted growth, small leaflets'
  },
  {
    id: 'tomato-blossom-end-rot', name: 'Blossom End Rot',
    aliases: ['BER', 'Black Bottom'],
    crops: ['Tomato', 'Capsicum', 'Chili', 'Eggplant', 'Watermelon'],
    type: 'deficiency',
    symptoms: ['Water-soaked spot at blossom end of fruit', 'Spot enlarges and turns dark brown/black', 'Lesion becomes sunken and leathery', 'Fruit ripens prematurely', 'Secondary fungal infection may occur on lesion'],
    causes: ['Calcium deficiency in fruit', 'Inconsistent watering (drought/flood cycles)', 'Rapid fruit growth', 'Root damage restricting calcium uptake', 'High nitrogen or ammonium levels'],
    spread: 'Non-infectious - physiological disorder, does not spread between fruits',
    favorable_conditions: ['Drought stress followed by heavy watering', 'Soil with low calcium', 'Excessive nitrogen fertilization', 'High salinity in soil', 'Rapid temperature fluctuations'],
    chemical_control: ['Calcium nitrate foliar spray 5g/L weekly', 'Calcium chloride 0.5% foliar spray', 'Gypsum application to soil 1kg/plant'],
    biological_control: ['Compost tea rich in calcium', 'Eggshell powder soil amendment', 'Bone meal application'],
    prevention: ['Maintain consistent soil moisture', 'Mulch to reduce evaporation', 'Avoid excessive nitrogen', 'Test and amend soil calcium', 'Water deeply and regularly', 'Use drip irrigation'],
    severity: 'medium', regions: ['India', 'Global'], season: ['Year-round'], image_hint: 'Dark sunken leathery spot on tomato blossom end'
  },
  // ===== RICE =====
  {
    id: 'rice-blast', name: 'Rice Blast',
    aliases: ['Paddy Blast', 'Leaf Blast', 'Neck Blast', 'Pyricularia Blast'],
    crops: ['Rice'],
    type: 'fungus',
    symptoms: ['Diamond-shaped lesions with grey centre and brown border on leaves', 'Nodes turn black and rot', 'Panicle neck turns brown/black', 'White/empty panicle (no grains)', 'Lesions on collar and leaf sheath'],
    causes: ['Magnaporthe oryzae (Pyricularia oryzae)', 'Infected seeds', 'Infected crop residue in soil'],
    spread: 'Airborne spores, wind, rain splash, infected seeds, can spread rapidly in fields',
    favorable_conditions: ['High humidity >90%', 'Prolonged leaf wetness', 'Cool temps 24-28°C', 'Excessive nitrogen fertilizer', 'Cloudy weather with intermittent rain'],
    chemical_control: ['Tricyclazole 0.6g/L', 'Carbendazim 1g/L', 'Isoprothiolane 1.5ml/L', 'Edifenphos 1ml/L', 'Apply at boot leaf and heading stage'],
    biological_control: ['Pseudomonas fluorescens seed treatment 10g/kg', 'Trichoderma viride 5g/L', 'Silicic acid foliar spray', 'Neem cake soil application'],
    prevention: ['Plant resistant varieties (e.g. MTU 1010, BPT 5204)', 'Balanced nitrogen application', 'Avoid dense planting', 'Keep fields drained during early infection', 'Seed treatment with biocontrol agents', 'Remove weed hosts from bunds'],
    severity: 'critical', regions: ['India', 'Southeast Asia', 'China', 'Africa', 'Global'], season: ['Kharif'], image_hint: 'Diamond-shaped lesions with grey center and brown border on rice leaves'
  },
  {
    id: 'rice-brown-spot', name: 'Brown Spot of Rice',
    aliases: ['Helminthosporium Leaf Spot'],
    crops: ['Rice'],
    type: 'fungus',
    symptoms: ['Oval to circular brown spots on leaves', 'Spots have yellow halo with grey center', 'Spots coalesce causing leaf drying', 'Dark brown spots on glumes (seed)', 'Grain discoloration and chalkiness'],
    causes: ['Bipolaris oryzae (Helminthosporium oryzae)', 'Nutritional deficiency (low soil K)', 'Infected seeds', 'Crop debris'],
    spread: 'Airborne spores, infected seeds, wind and rain splash',
    favorable_conditions: ['Poor soil fertility', 'Low potassium levels', 'Cool temps 20-25°C', 'High humidity', 'Drought or water stress'],
    chemical_control: ['Carbendazim + Mancozeb 2g/L', 'Edifenphos 1ml/L', 'Copper oxychloride 3g/L', 'Propiconazole 1ml/L'],
    biological_control: ['Pseudomonas fluorescens 10g/kg seed treatment', 'Trichoderma harzianum soil application', 'Neem oil 3ml/L'],
    prevention: ['Balanced NPK fertilization', 'Apply adequate potash (K)', 'Use disease-free certified seeds', 'Seed treatment with fungicide', 'Improve field drainage', 'Grow tolerant varieties like CR 1009'],
    severity: 'medium', regions: ['India', 'Southeast Asia', 'Global rice regions'], season: ['Kharif'], image_hint: 'Oval brown spots with yellow halo on rice leaves'
  },
  {
    id: 'rice-bacterial-blight', name: 'Bacterial Leaf Blight of Rice',
    aliases: ['BLB', 'Kresek'],
    crops: ['Rice'],
    type: 'bacteria',
    symptoms: ['Water-soaked streaks along leaf veins', 'Yellowish-orange leaves starting from tip', 'Leaves dry and turn white/grey', 'Wilting of entire plant (Kresek phase in young plants)', 'Bacterial ooze from cut leaf in water'],
    causes: ['Xanthomonas oryzae pv. oryzae', 'Infected seeds', 'Survives on weeds and crop residue'],
    spread: 'Wind-driven rain, irrigation water, contaminated tools, infected seeds',
    favorable_conditions: ['High temperature 28-34°C', 'High humidity', 'Heavy rain and wind', 'Excessive nitrogen', 'Deep water in fields'],
    chemical_control: ['Streptocycline 1g per 10L water', 'Copper oxychloride 3g/L', 'Kasugamycin 1ml/L', 'Apply at early sign of infection'],
    biological_control: ['Pseudomonas fluorescens foliar spray 10g/L', 'Bacillus subtilis 5g/L', 'Neem cake soil application 100kg/ha'],
    prevention: ['Use resistant varieties like IR 20, IR 64', 'Reduce nitrogen fertilizer', 'Drain fields before spraying', 'Avoid wounding plants during weeding', 'Use disease-free seeds', 'Field sanitation removing debris'],
    severity: 'high', regions: ['India', 'Southeast Asia', 'China', 'Philippines'], season: ['Kharif'], image_hint: 'Yellowish-white streaks from leaf tip along veins'
  },
  {
    id: 'rice-stem-borer', name: 'Rice Stem Borer',
    aliases: ['Yellow Stem Borer', 'Paddy Stem Borer', 'YSB'],
    crops: ['Rice', 'Maize', 'Sugarcane'],
    type: 'insect',
    symptoms: ['Dead heart in young tillers (central leaf dries)', 'White earheads in mature plants (empty panicles)', 'Small holes in stem with frass inside', 'Egg masses on leaf tips', 'Broken tillers and lodging'],
    causes: ['Scirpophaga incertulas (Yellow Stem Borer)', 'Larvae overwinter in stubble', 'Continuous rice cropping without break'],
    spread: 'Adult moths fly between fields, larvae crawl to nearby plants',
    favorable_conditions: ['Continuous flooding', 'High humidity', 'Dense planting', 'Excessive nitrogen', 'Stubble left after harvest'],
    chemical_control: ['Chlorantraniliprole 0.4ml/L', 'Flubendiamide 0.3ml/L', 'Cartap hydrochloride 2g/L', 'Apply during egg mass stage'],
    biological_control: ['Trichogramma japonicum egg parasitoid release 50k/ha', 'Neem oil 5ml/L', 'Bacillus thuringiensis (Bt) spray 2g/L', 'Light traps to monitor moth population'],
    prevention: ['Destroy stubble after harvest', 'Avoid continuous rice cropping', 'Stagger planting dates', 'Use pheromone traps for monitoring', 'Balanced fertilization', 'Flood fields in winter to drown larvae'],
    severity: 'high', regions: ['India', 'Southeast Asia', 'China', 'Bangladesh'], season: ['Kharif', 'Rabi'], image_hint: 'Dead heart - dried central tiller and white empty panicles'
  },
  // ===== WHEAT =====
  {
    id: 'wheat-rust-stripe', name: 'Stripe Rust (Yellow Rust) of Wheat',
    aliases: ['Yellow Rust', 'Puccinia striiformis'],
    crops: ['Wheat', 'Barley'],
    type: 'fungus',
    symptoms: ['Yellow-orange powdery pustules in stripes on leaves', 'Stripes follow leaf veins (linear)', 'Pustules rupture leaf epidermis', 'Leaves turn yellow and die prematurely', 'Reduced grain filling and shriveled kernels'],
    causes: ['Puccinia striiformis f.sp. tritici', 'Uredospores carried by wind from distant regions', 'Survives on volunteer wheat plants'],
    spread: 'Wind-borne uredospores can travel 100s of km, requires living host for survival',
    favorable_conditions: ['Cool moist weather 10-20°C', 'High humidity', 'Prolonged leaf wetness', 'Cloudy weather', 'Continuous wheat cultivation'],
    chemical_control: ['Tebuconazole 1ml/L', 'Propiconazole 1ml/L', 'Azoxystrobin + Tebuconazole 1ml/L', 'Mancozeb 2g/L', 'Apply at first sign of rust pustules'],
    biological_control: ['Sulfur spray 3g/L', 'Neem oil 5ml/L', 'Bacillus subtilis foliar spray'],
    prevention: ['Plant resistant varieties (e.g. HD 2967, PBW 725)', 'Early sowing', 'Destroy volunteer wheat before planting', 'Avoid excessive nitrogen', 'Monitor regularly in cool spring weather', 'Regional disease forecasting'],
    severity: 'critical', regions: ['India (NW plains)', 'China', 'Central Asia', 'Europe', 'North America'], season: ['Rabi', 'Spring'], image_hint: 'Bright yellow-orange powdery stripes along wheat leaf veins'
  },
  {
    id: 'wheat-powdery-mildew', name: 'Powdery Mildew of Wheat',
    aliases: ['Erysiphe graminis'],
    crops: ['Wheat', 'Barley', 'Oats'],
    type: 'fungus',
    symptoms: ['White powdery fungal growth on leaves and stems', 'Powdery coating can cover entire upper leaves', 'Leaves turn yellow then brown', 'Reduced tillering and grain size', 'Premature leaf death'],
    causes: ['Blumeria graminis (Erysiphe graminis) f.sp. tritici'],
    spread: 'Airborne spores, high humidity but no rain needed for infection',
    favorable_conditions: ['High humidity but dry leaves (no rain)', 'Cool temps 15-22°C', 'Dense canopy and shading', 'Excessive nitrogen', 'Susceptible varieties'],
    chemical_control: ['Tebuconazole 1ml/L', 'Propiconazole 0.5ml/L', 'Sulfur wettable 3g/L', 'Carbendazim 1g/L', 'Fluxapyroxad 0.5ml/L'],
    biological_control: ['Milk spray 1:10 dilution', 'Baking soda 5g/L + vegetable oil 2.5ml/L', 'Neem oil 5ml/L', 'Sulfur spray 3g/L'],
    prevention: ['Plant resistant varieties', 'Avoid excessive nitrogen', 'Wide row spacing', 'Remove volunteer plants', 'Crop rotation with non-cereals', 'Avoid dense planting'],
    severity: 'medium', regions: ['India (NW, NE)', 'Global temperate regions'], season: ['Rabi'], image_hint: 'White powdery coating on wheat leaves and stems'
  },
  // ===== POTATO =====
  {
    id: 'potato-late-blight', name: 'Potato Late Blight',
    aliases: ['Irish Potato Famine Disease', 'Phytophthora infestans'],
    crops: ['Potato', 'Tomato'],
    type: 'fungus',
    symptoms: ['Water-soaked pale green lesions on leaves', 'White mold growth on leaf undersides', 'Dark brown/black lesions on stems', 'Brown firm rot on tubers', 'Entire plant can collapse in 1-2 weeks'],
    causes: ['Phytophthora infestans (oomycete pathogen)', 'Infected seed tubers', 'Cull piles from previous season'],
    spread: 'Spores travel 30+ km in wind, rain splash, infected tubers, tomato plants nearby',
    favorable_conditions: ['Cool moist weather 10-20°C', 'High humidity >90%', 'Summer rain', 'Fog and heavy dew', 'Irrigation'],
    chemical_control: ['Metalaxyl-M + Mancozeb 2g/L', 'Cymoxanil + Mancozeb 2.5g/L', 'Chlorothalonil 2g/L', 'Dimethomorph 0.5g/L', 'Apply on 7-10 day schedule'],
    biological_control: ['Bacillus subtilis spray', 'Compost tea', 'Copper hydroxide 3g/L (organic approved)'],
    prevention: ['Use certified disease-free seed tubers', 'Plant resistant varieties (e.g. Kufri Jyoti)', 'Hill soil to cover tubers', 'Destroy cull piles and volunteers', 'Avoid excessive irrigation', 'Harvest 2-3 weeks after vine death'],
    severity: 'critical', regions: ['India (plateau regions)', 'Global'], season: ['Rabi', 'Winter'], image_hint: 'Water-soaked leaf lesions with white sporulation on undersides'
  },
  // ===== ONION & GARLIC =====
  {
    id: 'onion-purple-bloch', name: 'Purple Blotch of Onion',
    aliases: ['Alternaria porri'],
    crops: ['Onion', 'Garlic'],
    type: 'fungus',
    symptoms: ['Small sunken white lesions on leaves', 'Lesions enlarge turn purple/brown with yellow margin', 'Leaf tips die back', 'Infection on flower stalks reduces seed yield', 'Bulbs may rot in severe cases'],
    causes: ['Alternaria porri fungus', 'Infected seeds or sets', 'Plant debris'],
    spread: 'Wind and rain, thrips can spread spores, infected plant material',
    favorable_conditions: ['Warm humid weather 25-30°C', 'Extended leaf wetness', 'High humidity', 'Thrips infestation weakens plants', 'Poor soil fertility'],
    chemical_control: ['Mancozeb 2g/L', 'Chlorothalonil 2g/L', 'Difenoconazole 0.5ml/L', 'Azoxystrobin 1ml/L', 'Start sprays when first symptoms appear'],
    biological_control: ['Neem oil 5ml/L', 'Trichoderma viride 5g/L for soil treatment', 'Garlic extract 10ml/L'],
    prevention: ['Use disease-free bulbs/sets', '3-4 year crop rotation', 'Avoid overhead irrigation', 'Control thrips populations', 'Remove infected debris', 'Wider spacing'],
    severity: 'medium', regions: ['India', 'Global onion regions'], season: ['Rabi'], image_hint: 'Purple-brown sunken lesions with yellow margin on onion leaves'
  },
  {
    id: 'onion-thrips', name: 'Onion Thrips',
    aliases: ['Thrips tabaci'],
    crops: ['Onion', 'Garlic', 'Cabbage', 'Cotton'],
    type: 'insect',
    symptoms: ['Silvery-white patches on leaves', 'Leaf tips turn brown and wither', 'Leaves curl and distort', 'Stunted plant growth', 'Bulb size reduced significantly'],
    causes: ['Thrips tabaci (onion thrips)', 'Overwinters on weeds and crop debris', 'Hot dry weather favors population buildup'],
    spread: 'Adults fly short distances, wind can carry them longer, reproduce rapidly in hot dry conditions',
    favorable_conditions: ['Hot dry weather 30-35°C', 'Low humidity', 'Drought stress', 'Continuous onion cropping'],
    chemical_control: ['Spinosad 0.5ml/L', 'Imidacloprid 0.5ml/L', 'Fipronil 1ml/L', 'Cypermethrin 1ml/L', 'Alternate insecticides to prevent resistance'],
    biological_control: ['Neem oil 5ml/L', 'Azadirachtin 2ml/L', 'Predatory mites (Amblyseius spp.)', 'Blue sticky traps'],
    prevention: ['Intercrop with carrots or tomatoes', 'Heavy irrigation reduces thrips', 'Remove weed hosts', 'Use reflective mulch', 'Avoid planting next to grain fields', 'Trap crops'],
    severity: 'high', regions: ['India', 'Global onion regions'], season: ['Kharif', 'Summer'], image_hint: 'Silvery-white feeding patches and curling on onion leaves'
  },
  // ===== BRINJAL/EGGPLANT =====
  {
    id: 'brinjal-fruit-shoot-borer', name: 'Brinjal Fruit and Shoot Borer',
    aliases: ['Brinjal Borer', 'Leucinodes orbonalis', 'Eggplant Borer'],
    crops: ['Eggplant', 'Potato'],
    type: 'insect',
    symptoms: ['Young shoots wilt and droop (dead heart)', 'Bores holes in fruits with frass coming out', 'Entry holes on calyx end of fruit', 'Fruits become unmarketable with internal boring', 'Multiple fruits attacked on same plant'],
    causes: ['Leucinodes orbonalis (Brinjal Borer)', 'Larvae overwinter in fallen fruits and debris', 'Continuous brinjal cultivation'],
    spread: 'Adult moths fly at night, eggs laid on tender shoots, larvae bore inside',
    favorable_conditions: ['Continuous brinjal cropping', 'Warm humid weather', 'Dense planting', 'Excessive nitrogen', 'Monoculture without break'],
    chemical_control: ['Chlorantraniliprole 0.3ml/L', 'Emamectin benzoate 0.4g/L', 'Flubendiamide 0.3ml/L', 'Cypermethrin 1ml/L', 'Spray at 50% flowering'],
    biological_control: ['Neem oil 5ml/L at 7-day intervals', 'Bacillus thuringiensis 2g/L', 'Trichogramma wasp release 50k/ha', 'Collect and destroy infested fruits'],
    prevention: ['Avoid continuous brinjal cropping', 'Remove and destroy infested shoots/fruits', 'Use pheromone traps (8-12/ha)', 'Barrier cropping with maize', 'Grow tolerant varieties like Punjab Sadabahar'],
    severity: 'high', regions: ['India', 'Southeast Asia', 'South Asia'], season: ['Kharif', 'Summer'], image_hint: 'Drooping shoots and bores hole on brinjal fruit with frass'
  },
  // ===== OKRA =====
  {
    id: 'okra-yvmv', name: 'Okra Yellow Vein Mosaic Virus',
    aliases: ['YVMV', 'Bhindi Yellow Vein Mosaic', 'Yellow Vein Clearing'],
    crops: ['Okra'],
    type: 'virus',
    symptoms: ['Yellow vein clearing starting from small veins', 'Entire leaf turns yellow with green patches', 'Severe stunting of plant', 'Fruits are small, yellow, hard and unmarketable', 'Reduced yield up to 90%'],
    causes: ['Okra Yellow Vein Mosaic Virus (YVMV)', 'Transmitted by whitefly (Bemisia tabaci)'],
    spread: 'Whitefly vector, persistent transmission, not mechanically transmissible',
    favorable_conditions: ['High whitefly populations', 'Hot dry weather', 'Nearby infected okra fields', 'Weed hosts like Abutilon'],
    chemical_control: ['Imidacloprid 0.5ml/L for vector control', 'Buprofezin 0.5ml/L', 'Spray insecticides to manage whitefly population'],
    biological_control: ['Yellow sticky traps', 'Neem oil 5ml/L weekly spray', 'Reflective mulch silver plastic', 'Encourage ladybug predators'],
    prevention: ['Plant resistant varieties (e.g. Varsha Uphar, Aruna)', 'Whitefly-proof nursery netting', 'Remove infected plants early', 'Avoid okra near cotton/tomato fields', 'Border crop with maize/sorghum', 'Early sowing avoids peak whitefly'],
    severity: 'critical', regions: ['India', 'Bangladesh', 'Southeast Asia'], season: ['Kharif', 'Summer'], image_hint: 'Yellow vein clearing and yellow leaves with green patches on okra'
  },
  // ===== CHILIES/CAPSICUM =====
  {
    id: 'chili-anthracnose', name: 'Chili Anthracnose',
    aliases: ['Chili Dieback', 'Colletotrichum capsici', 'Fruit Rot'],
    crops: ['Chili', 'Capsicum'],
    type: 'fungus',
    symptoms: ['Circular sunken spots on ripe fruits', 'Spots have orange/pink spore masses in center', 'Leaf spots and defoliation', 'Dieback of branches from tip', 'Fruits drop prematurely'],
    causes: ['Colletotrichum capsici or C. gloeosporioides', 'Infected seeds', 'Survives on plant debris and soil'],
    spread: 'Airborne spores, rain splash, contaminated tools, infected seeds',
    favorable_conditions: ['Warm humid weather 25-30°C', 'Extended wetness', 'High rainfall', 'Dense plant canopy', 'Poor ventilation'],
    chemical_control: ['Azoxystrobin 1ml/L', 'Carbendazim 1g/L', 'Mancozeb 2g/L', 'Copper oxychloride 3g/L', 'Apply at flowering and fruit set'],
    biological_control: ['Bacillus subtilis 5g/L', 'Trichoderma viride 10g/L', 'Neem oil 5ml/L', 'Pseudomonas fluorescens 10g/kg seed treatment'],
    prevention: ['Use disease-free seeds (seed treatment)', '3-year crop rotation', 'Remove infected fruits and debris', 'Avoid overhead irrigation', 'Stake plants for air circulation', 'Harvest ripe fruits promptly'],
    severity: 'high', regions: ['India', 'Southeast Asia', 'Global chili regions'], season: ['Kharif'], image_hint: 'Circular sunken spots with orange spore masses on red chili fruits'
  },
  // ===== MANGO =====
  {
    id: 'mango-anthracnose', name: 'Mango Anthracnose',
    aliases: ['Colletotrichum gloeosporioides', 'Black Spot'],
    crops: ['Mango', 'Banana', 'Papaya', 'Avocado'],
    type: 'fungus',
    symptoms: ['Dark brown-black spots on leaves', 'Leaf blight and defoliation', 'Black sunken spots on fruits', 'Fruit rot and premature drop', 'Dieback of twigs and panicles'],
    causes: ['Colletotrichum gloeosporioides', 'Latent infections on immature fruits', 'Wet weather during flowering'],
    spread: 'Rain splash, wind, infected plant parts, fruit-to-fruit contact',
    favorable_conditions: ['Wet weather during flowering and fruit development', 'High humidity', 'Rain 20-30°C', 'Orchards with poor ventilation'],
    chemical_control: ['Copper oxychloride 3g/L', 'Carbendazim 1g/L', 'Mancozeb 2g/L', 'Hexaconazole 1ml/L', 'Spray at panicle emergence and fruit set'],
    biological_control: ['Neem oil 3ml/L during fruit set', 'Bacillus subtilis spray', 'Trichoderma viride soil drench'],
    prevention: ['Prune dead branches for air circulation', 'Remove infected fallen fruits', 'Avoid overhead irrigation', 'Pre-harvest sprays at 15-day intervals', 'Post-harvest hot water treatment 52°C for 5 min'],
    severity: 'high', regions: ['India', 'Southeast Asia', 'Global tropics'], season: ['Summer (flowering/fruiting)'], image_hint: 'Dark black spots on mango leaves and fruits with sunken lesions'
  },
  {
    id: 'mango-powdery-mildew', name: 'Mango Powdery Mildew',
    aliases: ['Oidium mangiferae'],
    crops: ['Mango'],
    type: 'fungus',
    symptoms: ['White powdery growth on panicles, flowers and young fruits', 'Flower drop and poor fruit set', 'Young fruits covered in white coating', 'Fruit cracking and russeting', 'Leaf distortion on tender shoots'],
    causes: ['Oidium mangiferae (fungus)'],
    spread: 'Airborne spores, high humidity but no free water needed',
    favorable_conditions: ['Cool dry weather 15-20°C', 'High humidity', 'Morning mist/fog', 'Low rainfall during flowering'],
    chemical_control: ['Sulfur wettable 3g/L', 'Tebuconazole 1ml/L', 'Dinocap 1ml/L', 'Hexaconazole 1ml/L', 'Apply at panicle emergence'],
    biological_control: ['Sulfur dusting 20-25 kg/ha', 'Baking soda spray 5g/L', 'Milk spray 1:10 dilution', 'Neem oil 5ml/L'],
    prevention: ['Spray during panicle emergence and flowering', 'Prune overcrowded branches', 'Adequate spacing between trees', 'Remove infected flower panicles', 'Use resistant varieties like Totapuri, Langra'],
    severity: 'medium', regions: ['India', 'Global mango regions'], season: ['Rabi (flowering season)'], image_hint: 'White powdery coating on mango panicles and young fruits'
  },
  // ===== BANANA =====
  {
    id: 'banana-panama-wilt', name: 'Panama Wilt (Fusarium Wilt)',
    aliases: ['Fusarium Wilt TR4', 'Banana Wilt', 'Fusarium oxysporum cubense'],
    crops: ['Banana'],
    type: 'fungus',
    symptoms: ['Yellowing of older leaves starting from margins', 'Leaf petioles collapse and hang down', 'Longitudinal splitting of pseudostem', 'Discoloration of vascular tissue (red-brown)', 'Plant wilts and dies completely'],
    causes: ['Fusarium oxysporum f.sp. cubense (Tropical Race 4 - TR4)', 'Infected suckers/planting material', 'Contaminated soil and water'],
    spread: 'Soil-borne, infected planting material, contaminated machinery, water runoff, persists in soil for 30+ years',
    favorable_conditions: ['Poor soil drainage', 'Acidic soil pH', 'Continuous banana cropping', 'Monoculture of susceptible varieties', 'Root damage from nematodes'],
    chemical_control: ['NO EFFECTIVE CHEMICAL CONTROL for TR4', 'Soil fumigation with Methyl bromide (banned in many countries)', 'Carbendazim soil drench for Race 1 (limited)'],
    biological_control: ['Trichoderma harzianum soil drench 10g/L', 'Pseudomonas fluorescens 10g/L', 'Neem cake soil application 1kg/plant', 'FYM + Trichoderma compost'],
    prevention: ['Use TC (tissue culture) plants from disease-free sources', 'Strict quarantine', 'Biosecurity: footbaths at farm entry', 'Grow resistant varieties like Grand Naine, Cavendish', 'Avoid planting in infested soil', '30+ year rotation if infested'],
    severity: 'critical', regions: ['India', 'Southeast Asia', 'China', 'Africa', 'Australia'], season: ['Year-round'], image_hint: 'Yellow lower leaves, pseudostem splitting with internal red-brown discoloration'
  },
  // ===== CITRUS =====
  {
    id: 'citrus-canker', name: 'Citrus Canker',
    aliases: ['Bacterial Canker', 'Xanthomonas citri', 'Citrus Canker'],
    crops: ['Citrus', 'Orange', 'Lemon', 'Lime', 'Grapefruit'],
    type: 'bacteria',
    symptoms: ['Raised corky lesions on leaves, fruit and stems', 'Lesions have water-soaked margin and yellow halo', 'Cankers on fruit reduce market value', 'Premature leaf and fruit drop', 'Twig dieback'],
    causes: ['Xanthomonas citri subsp. citri', 'Infected nursery stock', 'Survives on plant debris', 'Wind-driven rain spreads bacteria'],
    spread: 'Rain splash, wind, contaminated tools, infected nursery stock, citrus leaf miner wounds',
    favorable_conditions: ['Warm humid weather 25-35°C', 'Frequent rain', 'Heavy winds', 'Citrus leaf miner infestation (creates entry wounds)', 'Flush growth period'],
    chemical_control: ['Copper oxychloride 3g/L', 'Streptocycline 1g/10L', 'Bordeaux mixture 1:1:10', 'Spray after pruning and during flush growth'],
    biological_control: ['Bacillus subtilis 10g/L', 'Garlic extract 10ml/L', 'Neem oil 3ml/L (also controls leaf miner)'],
    prevention: ['Use certified disease-free nursery plants', 'Implement windbreaks around orchard', 'Control citrus leaf miner', 'Remove infected plant parts', 'Disinfect pruning tools with bleach', 'Follow strict quarantine'],
    severity: 'high', regions: ['India', 'Global citrus regions', 'Southeast Asia', 'South America'], season: ['Kharif (monsoon)'], image_hint: 'Raised corky brown spots with yellow halo on citrus leaves and fruit'
  },
  // ===== GRAPE =====
  {
    id: 'grape-downy-mildew', name: 'Grape Downy Mildew',
    aliases: ['Plasmopara viticola'],
    crops: ['Grape'],
    type: 'fungus',
    symptoms: ['Yellow oily spots on upper leaf surface', 'White downy growth on leaf undersides', 'Leaf browning and premature defoliation', 'Infected berries turn brown and shrivel', 'Shoot tips curl and die'],
    causes: ['Plasmopara viticola (oomycete)'],
    spread: 'Airborne spores, rain splash, survives in fallen leaves',
    favorable_conditions: ['Cool wet weather 20-25°C', 'High humidity >95%', 'Rainfall and extended wetness', 'Poor air circulation', 'Dense canopy'],
    chemical_control: ['Copper oxychloride 3g/L', 'Metalaxyl + Mancozeb 2.5g/L', 'Dimethomorph 0.5g/L', 'Bordeaux mixture 1:1:10', 'Preventative spray before rain'],
    biological_control: ['Bacillus subtilis 5g/L', 'Copper soap spray', 'Compost tea', 'Milk spray 1:10'],
    prevention: ['Avoid overhead irrigation', 'Prune for open canopy', 'Remove infected leaves', 'Proper trellising for air flow', 'Monitor during wet weather', 'Sulfur dust before infection'],
    severity: 'high', regions: ['India (Maharashtra, Karnataka)', 'Global wine regions'], season: ['Monsoon', 'Spring'], image_hint: 'Yellow oily spots on leaves with white downy growth underside'
  },
  // ===== TURMERIC =====
  {
    id: 'turmeric-rhizome-rot', name: 'Turmeric Rhizome Rot',
    aliases: ['Turmeric Soft Rot', 'Pythium Rot', 'Rhizome Rot'],
    crops: ['Turmeric', 'Ginger'],
    type: 'fungus',
    symptoms: ['Yellowing and drying of leaves from tip', 'Base of pseudostem becomes soft', 'Rhizomes show water-soaked rot', 'Rot progresses from outer to inner tissue', 'Foul smell from rotting rhizomes'],
    causes: ['Pythium graminicola or P. aphanidermatum', 'Excessive soil moisture', 'Poor drainage', 'Infected seed rhizomes'],
    spread: 'Soil-borne, water-borne, infected seed rhizomes, contaminated irrigation water',
    favorable_conditions: ['Waterlogged conditions', 'Poor drainage', 'Continuous turmeric cultivation', 'Warm wet weather', 'Heavy clay soil'],
    chemical_control: ['Metalaxyl + Mancozeb 2g/L drench', 'Copper oxychloride 3g/L drench', 'Carbendazim 1g/L seed treatment', 'Drench soil before planting'],
    biological_control: ['Trichoderma harzianum 10g/kg seed rhizome treatment', 'Pseudomonas fluorescens 10g/L soil drench', 'Neem cake 100g/m² soil amendment', 'FYM enriched with Trichoderma'],
    prevention: ['Use disease-free seed rhizomes', 'Well-drained soil (raised beds)', '3-4 year rotation', 'Seed treatment before planting', 'Avoid waterlogging', 'Remove and destroy infected plants'],
    severity: 'high', regions: ['India', 'Southeast Asia'], season: ['Kharif'], image_hint: 'Yellowing leaves and soft rotting rhizomes with discoloration'
  },
  // ===== SUGARCANE =====
  {
    id: 'sugarcane-red-rot', name: 'Sugarcane Red Rot',
    aliases: ['Red Rot of Sugarcane', 'Colletotrichum falcatum'],
    crops: ['Sugarcane'],
    type: 'fungus',
    symptoms: ['Red discoloration of internal stalk tissue', 'White patches across red tissue', 'Leaves turn yellow and dry from margin', 'Stalk splits longitudinally', 'Sweet/acidic smell of rotting cane'],
    causes: ['Colletotrichum falcatum', 'Infected setts (seed pieces)', 'Survives in stubble and soil'],
    spread: 'Infected seed cane, water, wind, contaminated tools, soil',
    favorable_conditions: ['Warm humid weather 25-30°C', 'Ratoon cropping (continuous)', 'Waterlogged conditions', 'Damage from stalk borers'],
    chemical_control: ['Carbendazim 1g/L sett treatment', 'Mancozeb 2g/L spray', 'Copper oxychloride 3g/L','Hot water treatment of setts 50°C for 30 min'],
    biological_control: ['Trichoderma viride 10g/kg sett treatment', 'Pseudomonas fluorescens sett dipping', 'Neem cake soil application 100kg/ha'],
    prevention: ['Use disease-free certified setts', 'Grow resistant varieties (e.g. Co 0238)', 'Avoid ratooning more than 2 years', 'Remove and destroy infected canes', 'Long rotation with legumes', 'Hot water treatment of setts'],
    severity: 'critical', regions: ['India', 'Pakistan', 'Bangladesh'], season: ['Year-round'], image_hint: 'Red internal stalk discoloration with white transverse patches'
  },
  // ===== COTTON =====
  {
    id: 'cotton-pink-bollworm', name: 'Pink Bollworm',
    aliases: ['Pectinophora gossypiella', 'Cotton Bollworm'],
    crops: ['Cotton', 'Okra'],
    type: 'insect',
    symptoms: ['Rosetted flowers (petals tied together)', 'Bolls fail to open properly', 'Larvae bore inside bolls and feed on seeds', 'Stained lint (yellow/brown)', 'Exit holes in bolls'],
    causes: ['Pectinophora gossypiella', 'Larvae diapause in cotton seeds', 'Continuous cotton cultivation'],
    spread: 'Adult moths fly, larvae hidden in seeds, spread through infested lint and seed transport',
    favorable_conditions: ['Warm dry weather', 'Continuous cotton (monoculture)', 'Bt cotton resistance increasing', 'Extended cotton season', 'No crop rotation'],
    chemical_control: ['Emamectin benzoate 0.4g/L', 'Indoxacarb 0.5ml/L', 'Spinosad 0.5ml/L', 'Chlorantraniliprole 0.4ml/L'],
    biological_control: ['Trichogramma wasp release 1.5 lakh/ha', 'Neem oil 5ml/L', 'Bt spray 2g/L', 'Pheromone traps 12/ha', 'Grow trap crops like marigold'],
    prevention: ['Grow Bt cotton (resistant)', 'Short duration varieties', 'Destroy crop residue immediately after harvest', 'Early sowing', 'Pheromone-mediated mating disruption', 'Avoid staggered planting'],
    severity: 'high', regions: ['India', 'China', 'Global cotton regions'], season: ['Kharif'], image_hint: 'Rosetted flower buds and boll damage with stained lint'
  },
  // ===== GROUNDNUT =====
  {
    id: 'groundnut-tikka-disease', name: 'Tikka Disease of Groundnut',
    aliases: ['Early Leaf Spot', 'Late Leaf Spot', 'Cercospora Leaf Spot'],
    crops: ['Groundnut'],
    type: 'fungus',
    symptoms: ['Brown to dark brown spots on leaves (early)', 'Black spots on leaves (late leaf spot)', 'Yellow halo around spots', 'Premature defoliation starting from lower leaves', 'Reduced kernel size and yield'],
    causes: ['Cercospora arachidicola (early)', 'Phaeoisariopsis personata (late)'],
    spread: 'Wind-borne, rain splash, infected crop residue',
    favorable_conditions: ['Warm humid weather 25-30°C', 'High rainfall', 'Extended leaf wetness', 'Dense canopy', 'Continuous groundnut cultivation'],
    chemical_control: ['Tebuconazole 1ml/L', 'Chlorothalonil 2g/L', 'Mancozeb 2g/L', 'Hexaconazole 1ml/L', 'Apply 30-45 days after sowing'],
    biological_control: ['Bacillus subtilis 5g/L', 'Neem oil 3ml/L', 'Pseudomonas fluorescens 10g/L'],
    prevention: ['Grow resistant varieties like Kadiri 6', 'Crop rotation with cereals', 'Remove infected debris', 'Early sowing', 'Adjust plant spacing', 'Clean cultivation'],
    severity: 'high', regions: ['India', 'Africa', 'Southeast Asia'], season: ['Kharif'], image_hint: 'Brown-black circular spots with yellow halo on groundnut leaves'
  },
  // ===== MAIZE =====
  {
    id: 'maize-fall-armyworm', name: 'Fall Armyworm',
    aliases: ['FAW', 'Spodoptera frugiperda', 'Armyworm'],
    crops: ['Maize', 'Sorghum', 'Rice', 'Sugarcane', 'Cotton'],
    type: 'insect',
    symptoms: ['Window-pane damage on young leaves', 'Large ragged holes in leaves', 'Frass (fecal pellets) near whorl', 'Bored stalk and ear damage', 'Death of growing point (dead heart)'],
    causes: ['Spodoptera frugiperda (Fall Armyworm)', 'Migratory pest from Americas', 'Survives year-round in warm climates'],
    spread: 'Adult moths fly 100+ km per night, larvae spread by wind on silken threads',
    favorable_conditions: ['Warm wet weather', 'Continuous maize cultivation', 'Extended cropping season', 'Lack of natural enemies', 'No crop rotation'],
    chemical_control: ['Emamectin benzoate 0.4g/L', 'Spinosad 0.5ml/L', 'Chlorantraniliprole 0.4ml/L', 'Thiomethoxam 0.5g/L', 'Apply in whorl stage'],
    biological_control: ['Neem oil 5ml/L in whorl', 'Bacillus thuringiensis 2g/L', 'Trichogramma release 50k/ha', 'Predatory beetles and earwigs', 'Sand/ash in whorls'],
    prevention: ['Early planting', 'Deep ploughing to expose pupae', 'Use pheromone traps (4/ha)', 'Intercrop with cowpea/beans', 'Scout fields weekly', 'Apply biologicals before chemicals'],
    severity: 'critical', regions: ['India', 'Africa', 'Southeast Asia', 'Global tropics'], season: ['Kharif', 'Summer'], image_hint: 'Window-pane damage and ragged holes on maize whorl leaves with frass'
  },
  // ===== SORGHUM =====
  {
    id: 'sorghum-ergot', name: 'Ergot of Sorghum',
    aliases: ['Sugary Disease', 'Claviceps africana', 'Sorghum Ergot'],
    crops: ['Sorghum'],
    type: 'fungus',
    symptoms: ['Honeydew (sticky sugary exudate) on panicles', 'Sclerotia (ergot bodies) replace grain', 'Flowering heads stick together', 'Reduced grain yield', 'Sugary droplets attract insects'],
    causes: ['Claviceps africana (ergot fungus)', 'Cool nights during flowering'],
    spread: 'Airborne spores, insect-carried, infected seeds',
    favorable_conditions: ['Cool temps 20-25°C during flowering', 'High humidity', 'Rain during flowering', 'Continuous sorghum cropping', 'Male sterile lines more susceptible'],
    chemical_control: ['Propiconazole 1ml/L', 'Tebuconazole 0.5ml/L', 'Carbendazim 1g/L', 'Spray at boot leaf stage'],
    biological_control: ['Remove ergot bodies from seed', 'Bacillus subtilis spray'],
    prevention: ['Plant resistant hybrids', 'Avoid late planting', 'Crop rotation', 'Deep ploughing to bury sclerotia', 'Clean seed', 'Adjust planting to avoid cool flowering'],
    severity: 'medium', regions: ['India', 'Africa', 'Global sorghum regions'], season: ['Rabi'], image_hint: 'Sticky honeydew droplets and brown ergot bodies on sorghum panicle'
  },
  // ===== CUCURBITS =====
  {
    id: 'cucurbit-downy-mildew', name: 'Downy Mildew of Cucurbits',
    aliases: ['Pseudoperonospora cubensis'],
    crops: ['Cucumber', 'Pumpkin', 'Melon', 'Watermelon', 'Bottle Gourd', 'Bitter Gourd'],
    type: 'fungus',
    symptoms: ['Angular yellow spots bounded by veins on upper leaf', 'Purple-gray downy growth on leaf undersides', 'Rapid leaf browning and death', 'Fruits exposed to sunburn (leaves gone)', 'Yield reduction 50-100%'],
    causes: ['Pseudoperonospora cubensis (oomycete)'],
    spread: 'Airborne spores travel long distance, survives on wild cucurbits',
    favorable_conditions: ['Cool wet weather 15-25°C', 'High humidity', 'Night temperatures cool', 'Free moisture on leaves', 'Fog and heavy dew'],
    chemical_control: ['Metalaxyl + Mancozeb 2.5g/L', 'Cymoxanil + Mancozeb 2g/L', 'Copper oxychloride 3g/L', 'Dimethomorph 0.5g/L', 'Apply protectant before infection'],
    biological_control: ['Bacillus subtilis 5g/L', 'Neem oil 5ml/L', 'Potassium bicarbonate 5g/L', 'Copper soap spray'],
    prevention: ['Grow resistant/tolerant varieties', 'Avoid overhead irrigation', 'Proper trellising', 'Row orientation for wind drying', 'Scout daily in wet weather', 'Remove volunteer cucurbits'],
    severity: 'high', regions: ['India', 'Global cucurbit regions'], season: ['Kharif', 'Rabi'], image_hint: 'Angular yellow spots between veins and purple-gray growth on leaf undersides'
  },
  // ===== COFFEE =====
  {
    id: 'coffee-leaf-rust', name: 'Coffee Leaf Rust',
    aliases: ['Hemileia vastatrix', 'Coffee Rust', 'La Roya'],
    crops: ['Coffee'],
    type: 'fungus',
    symptoms: ['Pale yellow spots on upper leaf surface', 'Orange-yellow powdery pustules on leaf undersides', 'Severe defoliation', 'Branches die back', 'Reduced yield next season'],
    causes: ['Hemileia vastatrix', 'Susceptible Arabica varieties', 'Continuous coffee monoculture'],
    spread: 'Wind-borne spores, rain splash, infected nursery plants',
    favorable_conditions: ['Temperatures 20-28°C', 'High humidity', 'Alternating wet and dry periods', 'Dense canopy without pruning', 'Continuous coffee cropping'],
    chemical_control: ['Triadimefon 0.5g/L', 'Cyproconazole 0.5ml/L', 'Copper oxychloride 3g/L', 'Apply at onset of rainy season'],
    biological_control: ['Bacillus subtilis spray', 'Neem oil 3ml/L', 'Compost tea regular spray'],
    prevention: ['Plant resistant varieties', 'Prune for open canopy', 'Shade management', 'Proper nutrition', 'Remove rusted leaves during pruning', 'Regional disease forecasting'],
    severity: 'high', regions: ['India (Karnataka, Kerala)', 'Global coffee regions', 'Central America'], season: ['Monsoon'], image_hint: 'Orange-yellow powdery pustules on underside of coffee leaves'
  },
  // ===== POMEGRANATE =====
  {
    id: 'pomegranate-bacterial-blight', name: 'Pomegranate Bacterial Blight',
    aliases: ['Pomegranate Wilt', 'Bacterial Leaf Spot', 'Xanthomonas Blight'],
    crops: ['Pomegranate'],
    type: 'bacteria',
    symptoms: ['Dark brown/black spots on leaves', 'Water-soaked lesions on fruit skin', 'Fruit cracking and rotting', 'Cankers on branches', 'Wilting of branches and dieback'],
    causes: ['Xanthomonas axonopodis pv. punicae', 'Infected cuttings', 'Continuous pomegranate cultivation'],
    spread: 'Rain splash, irrigation water, infected pruning tools, nursery plants',
    favorable_conditions: ['Warm humid monsoon weather', 'High temperature and humidity', 'Rainfall', 'Continuous cropping without break', 'Wounds from thorns or pruning'],
    chemical_control: ['Streptocycline 1g/10L water', 'Copper oxychloride 3g/L', 'Kasugamycin 1ml/L', 'Bordeaux mixture 1:1:10'],
    biological_control: ['Bacillus subtilis 10g/L', 'Pseudomonas fluorescens 10g/L', 'Neem oil 5ml/L'],
    prevention: ['Use disease-free cuttings', 'Prune and destroy infected parts', 'Disinfect pruning tools', 'Avoid overhead irrigation', 'Balanced fertilization', 'Maintain tree spacing'],
    severity: 'high', regions: ['India (Maharashtra, Karnataka)', 'Global pomegranate regions'], season: ['Kharif', 'Monsoon'], image_hint: 'Dark water-soaked lesions on pomegranate fruit and leaves'
  },
  // ===== PEA/BEANS =====
  {
    id: 'pea-powdery-mildew', name: 'Powdery Mildew of Pea',
    aliases: ['Erysiphe polygoni'],
    crops: ['Pea', 'Beans', 'Lentil', 'Chickpea'],
    type: 'fungus',
    symptoms: ['White powdery coating on leaves and pods', 'Leaves turn yellow then brown', 'Stunted plant growth', 'Pods become smaller and distorted', 'Reduced pod set and grain filling'],
    causes: ['Erysiphe polygoni', 'Survives on crop debris', 'Volunteer plants as reservoirs'],
    spread: 'Airborne spores, moderate humidity without rain needed',
    favorable_conditions: ['Moderate humidity 60-80%', 'Temps 15-25°C', 'Dry weather (no rain)', 'Cloudy days', 'Dense planting'],
    chemical_control: ['Sulfur 3g/L', 'Carbendazim 1g/L', 'Tebuconazole 1ml/L', 'Dinocap 1ml/L'],
    biological_control: ['Milk spray 1:9', 'Baking soda 5g/L + oil', 'Neem oil 5ml/L', 'Bacillus subtilis'],
    prevention: ['Grow resistant varieties', 'Avoid dense planting', 'Crop rotation', 'Remove infected debris', 'Avoid excess nitrogen', 'Early sowing to escape disease'],
    severity: 'medium', regions: ['India', 'Global legume regions'], season: ['Rabi'], image_hint: 'White powdery coating covering pea leaves and pods'
  },
  // ===== CHICKPEA =====
  {
    id: 'chickpea-wilt', name: 'Chickpea Wilt',
    aliases: ['Gram Wilt', 'Fusarium Wilt of Chickpea', 'Fusarium oxysporum'],
    crops: ['Chickpea', 'Pigeon Pea'],
    type: 'fungus',
    symptoms: ['Sudden drooping of leaves and petioles', 'Dull green colour then yellowing', 'Complete wilting of plant within 2 weeks', 'Brown vascular discoloration in stem', 'Partial wilting (one-sided) common'],
    causes: ['Fusarium oxysporum f.sp. ciceri', 'Soil-borne fungus persists for years', 'Infected seeds'],
    spread: 'Soil-borne, seed-borne, through root infection, survives in soil as chlamydospores',
    favorable_conditions: ['Soil temperatures 25-30°C', 'Low soil moisture (drought stress)', 'Sandy soils', 'Continuous chickpea cultivation', 'Wilt-susceptible varieties'],
    chemical_control: ['Carbendazim 2g/kg seed treatment', 'Thiram + Carboxin 2g/kg', 'Seed treatment with fungicide + Trichoderma'],
    biological_control: ['Trichoderma viride 10g/kg seed treatment', 'Pseudomonas fluorescens 10g/kg', 'Neem cake soil application 100kg/ha'],
    prevention: ['Grow wilt-tolerant varieties (e.g. JG 11, KAK 2)', 'Long rotation (4-5 years)', 'Seed treatment with biocontrol + fungicide', 'Add organic matter to soil', 'Remove wilted plants immediately', 'Early sowing'],
    severity: 'high', regions: ['India', 'Pakistan', 'Bangladesh', 'Myanmar'], season: ['Rabi'], image_hint: 'Sudden drooping and yellowing of chickpea plants with brown stem'
  },
  // ===== GENERAL NUTRIENT DEFICIENCIES =====
  {
    id: 'nitrogen-deficiency', name: 'Nitrogen Deficiency',
    aliases: ['N Deficiency', 'General Chlorosis', 'Leaf Yellowing'],
    crops: ['General (all crops)'],
    type: 'deficiency',
    symptoms: ['Uniform pale green to yellow leaves (chlorosis) starting from older leaves', 'Stunted growth and thin stems', 'Small leaves and reduced tillering', 'Purple/red tint on undersides (some crops)', 'Poor yield and grain quality'],
    causes: ['Insufficient N in soil', 'Leaching from heavy rain', 'Low organic matter', 'Too much carbon-rich organic matter (straw) immobilizes N', 'Sandy soils'],
    spread: 'Non-infectious - physiological, affects entire crop uniformly',
    favorable_conditions: ['Sandy or leached soils', 'Heavy rainfall', 'Low organic matter', 'Cold/wet soils', 'High carbon crop residue incorporation'],
    chemical_control: ['Urea 2% foliar spray', 'NPK balanced fertilizer as per soil test', 'Ammonium sulphate for rapid correction'],
    biological_control: ['Green manuring with legumes', 'FYM/compost application 5t/ha', 'Vermicompost 2t/ha', 'Azotobacter or Rhizobium biofertilizer'],
    prevention: ['Soil test before planting', 'Apply N in split doses', 'Incorporate organic matter', 'Green manure crops in rotation', 'Use slow-release N sources', 'Avoid over-irrigation'],
    severity: 'medium', regions: ['India', 'Global'], season: ['Year-round'], image_hint: 'Uniform yellowing of older leaves starting from leaf tip'
  },
  {
    id: 'zinc-deficiency', name: 'Zinc Deficiency',
    aliases: ['Zn Deficiency', 'Khaira Disease of Rice', 'Little Leaf'],
    crops: ['Rice', 'Wheat', 'Maize', 'Potato', 'Citrus', 'Mango', 'General'],
    type: 'deficiency',
    symptoms: ['Interveinal chlorosis on younger leaves', 'Shortened internodes (rosetting)', 'Small narrow leaves (little leaf)', 'White/pale yellow patches in rice (khaira)', 'Poor panicle emergence and grain filling'],
    causes: ['Low available zinc in soil', 'High pH soils (alkaline)', 'Excessive phosphorus fertilization', 'Calcareous soils', 'Cold wet soils'],
    spread: 'Non-infectious - physiological, pattern varies by field position',
    favorable_conditions: ['High pH >7.5', 'Calcareous soils', 'Low organic matter', 'Excessive phosphates', 'Cold and wet conditions', 'Flooded rice fields'],
    chemical_control: ['ZnSO4 0.5% foliar spray', 'ZnSO4 25kg/ha soil application', 'Chelated zinc 1ml/L spray', 'Apply 2-3 sprays at 10-day intervals'],
    biological_control: ['Zn-solubilizing bacteria (Bacillus spp.)', 'FYM + Zn mixture', 'Vermicompost contains available Zn'],
    prevention: ['Soil test before planting', 'Seed treatment with 2% ZnSO4', 'Balanced NPK (avoid excess P)', 'Incorporate organic matter', 'Use Zn-enriched fertilizers', 'Maintain proper pH'],
    severity: 'medium', regions: ['India (widespread)', 'Global calcareous soil regions'], season: ['Year-round'], image_hint: 'Interveinal yellowing on young leaves with stunted growth and small leaves'
  },
  {
    id: 'iron-deficiency', name: 'Iron Deficiency',
    aliases: ['Fe Deficiency', 'Lime-induced Chlorosis', 'Iron Chlorosis'],
    crops: ['General', 'Citrus', 'Groundnut', 'Chickpea', 'Rice', 'Sorghum'],
    type: 'deficiency',
    symptoms: ['Interveinal chlorosis on youngest leaves (bright yellow between green veins)', 'Severe cases - entire new leaf white/pale', 'Stunted growth', 'Poor yield', 'Affects new growth first unlike N deficiency'],
    causes: ['High soil pH >7.5 (lime-induced)', 'Poor drainage', 'Calcareous soils', 'Excessive heavy metals', 'Low organic matter'],
    spread: 'Non-infectious - physiological, most severe in calcareous soils',
    favorable_conditions: ['Alkaline soils pH >7.5', 'Calcareous soils (free CaCO3)', 'Poorly drained soils', 'Cold soils', 'Excessive Cu, Mn, Zn in soil'],
    chemical_control: ['FeSO4 1% foliar spray with citric acid', 'Fe-EDTA 0.5g/L foliar', 'Fe-chelate soil application', 'Add citric acid to spray solution'],
    biological_control: ['Iron-chelating microbes', 'Compost tea', 'Green manuring', 'FYM application'],
    prevention: ['Lower soil pH with sulfur (S)', 'Improve drainage', 'Use acidifying fertilizers (ammonium sulfate)', 'Foliar sprays for quick correction', 'Choose tolerant species/varieties', 'Avoid excessive P and lime'],
    severity: 'medium', regions: ['India (calcareous)', 'Global high-pH regions'], season: ['Year-round'], image_hint: 'Bright yellow between green veins on youngest leaves, older leaves green'
  },
  // ===== Additional Insects =====
  {
    id: 'whitefly-general', name: 'Whitefly',
    aliases: ['Bemisia tabaci', 'Cotton Whitefly', 'Silverleaf Whitefly'],
    crops: ['Cotton', 'Tomato', 'Okra', 'Brinjal', 'Capsicum', 'Chili', 'Cucumber', 'General'],
    type: 'insect',
    symptoms: ['Tiny white flying insects on leaf undersides', 'Yellowing and drying of leaves', 'Sticky honeydew on leaves (sooty mold grows)', 'Plants become sticky with honeydew', 'Stunted growth and fruit deformation'],
    causes: ['Bemisia tabaci (whitefly)', 'Multiple hosts and crops'],
    spread: 'Adults fly, spread plant viruses (esp. TYLCV, YVMV), reproduce rapidly in warm weather',
    favorable_conditions: ['Hot dry weather 30-40°C', 'Dry conditions', 'Continuous cropping', 'Overuse of broad-spectrum insecticides kills predators', 'Lush plant growth'],
    chemical_control: ['Imidacloprid 0.5ml/L', 'Buprofezin 0.5ml/L', 'Diafenthiuron 0.5g/L', 'Pyriproxyfen 1ml/L', 'Rotate insecticides to prevent resistance'],
    biological_control: ['Yellow sticky traps 40/ha', 'Neem oil 5ml/L weekly', 'Encabia (Encarsia) parasitoid wasp', 'Ladybugs and lacewings', 'Reflective silver mulch'],
    prevention: ['Avoid monoculture', 'Intercrop with maize/sorghum', 'Remove weed hosts', 'Use reflective mulch', 'Avoid over-fertilization', 'Crop-free period between seasons'],
    severity: 'high', regions: ['India', 'Global tropical/subtropical'], season: ['Kharif', 'Summer'], image_hint: 'Tiny white flies on leaf undersides with yellowing and sooty mold'
  },
  {
    id: 'thrips-general', name: 'Thrips',
    aliases: ['Thysanoptera', 'Thrips tabaci', 'Paddy Thrips'],
    crops: ['General', 'Cotton', 'Onion', 'Chili', 'Grape', 'Mango', 'Tea'],
    type: 'insect',
    symptoms: ['Silvery streaks and patches on leaves', 'Leaves curl and become brittle', 'Scarred and distorted fruits', 'Bud drop in flowers', 'Black specks of frass on leaves'],
    causes: ['Multiple thrips species', 'Weed hosts', 'Surviving in crop residue'],
    spread: 'Crawling and weak flying, wind-assisted, rapid reproduction in hot weather',
    favorable_conditions: ['Hot dry weather 30-38°C', 'Drought stress', 'Low humidity', 'Weedy fields', 'Continuous cropping'],
    chemical_control: ['Spinosad 0.5ml/L', 'Fipronil 1ml/L', 'Imidacloprid 0.5ml/L', 'Thiamethoxam 0.5g/L'],
    biological_control: ['Predatory mites (Amblyseius swirskii)', 'Neem oil 5ml/L', 'Blue sticky traps', 'Lacewing larvae release'],
    prevention: ['Use reflective mulch', 'Irrigation reduces populations', 'Remove weed hosts', 'Avoid planting near onion/garlic', 'Trap crops like marigold', 'Quarantine new plants'],
    severity: 'high', regions: ['India', 'Global'], season: ['Summer', 'Kharif'], image_hint: 'Silvery feeding streaks and curling on leaves with black frass specks'
  },
  {
    id: 'aphid-general', name: 'Aphids',
    aliases: ['Plant Lice', 'Greenfly', 'Blackfly'],
    crops: ['General', 'Tomato', 'Beans', 'Peas', 'Chili', 'Cabbage', 'Cotton', 'Wheat'],
    type: 'insect',
    symptoms: ['Clusters of small insects on new growth and under leaves', 'Curling and distortion of young leaves', 'Sticky honeydew on leaves', 'Sooty mold on honeydew', 'Ants attracted to honeydew'],
    causes: ['Multiple aphid species', 'Weed hosts, ant protection',
    'Untended gardens and crops'],
    spread: 'Winged aphids fly short distances, wind can carry them, ants often transport wingless forms',
    favorable_conditions: ['Moderate temps 20-28°C', 'New lush growth', 'Excessive nitrogen fertilizer', 'Ant presence protecting them', 'Lack of natural predators'],
    chemical_control: ['Imidacloprid 0.5ml/L', 'Thiamethoxam 0.5g/L', 'Dimethoate 1ml/L', 'Acephate 1g/L', 'Spray directly on aphid clusters'],
    biological_control: ['Ladybugs (release 5000/acre)', 'Lacewing larvae', 'Parasitic wasps (Aphidius spp.)', 'Neem oil 5ml/L', 'Strong water spray to knock off'],
    prevention: ['Attract beneficial insects (flowering plants)', 'Avoid excess nitrogen', 'Monitor new growth regularly', 'Ant control (sticky tree bands)', 'Intercrop with aromatic plants (garlic, onion)', 'Companion planting'],
    severity: 'medium', regions: ['India', 'Global'], season: ['Spring', 'Rabi'], image_hint: 'Clusters of small green/black insects on tender shoots and leaf undersides'
  },
  // ===== CABBAGE/CAULIFLOWER =====
  {
    id: 'cabbage-dbm', name: 'Diamondback Moth',
    aliases: ['DBM', 'Plutella xylostella', 'Cabbage Caterpillar'],
    crops: ['Cabbage', 'Cauliflower', 'Broccoli', 'Kale', 'Mustard'],
    type: 'insect',
    symptoms: ['Small green caterpillars chewing leaves', 'Irregular holes in leaves (window-pane)', 'Heads and florets damaged', 'Heavy infestation skeletonizes leaves', 'Small silken cocoons on leaves'],
    causes: ['Plutella xylostella (Diamondback Moth)', 'Continuous crucifer cropping'],
    spread: 'Adult moths fly, highly mobile, resistant to many insecticides worldwide',
    favorable_conditions: ['Warm weather 25-35°C', 'Continuous crucifer cultivation', 'Pesticide resistance developing', 'Dry weather', 'Lack of crop rotation'],
    chemical_control: ['Spinosad 0.5ml/L', 'Emamectin benzoate 0.4g/L', 'Chlorantraniliprole 0.4ml/L', 'Bt (Bacillus thuringiensis) 2g/L', 'Rotate insecticides with different modes'],
    biological_control: ['Bt (Bacillus thuringiensis) spray', 'Neem oil 5ml/L', 'Trichogramma parasitoid release', 'Predatory wasps (Cotesia spp.)'],
    prevention: ['Crop rotation with non-crucifers', 'Destroy crop residue after harvest', 'Use trap crops (mustard)', 'Attract natural enemies with flowers', 'Avoid continuous crucifer cropping', 'Pheromone traps 12/ha for monitoring'],
    severity: 'high', regions: ['India', 'Global crucifer regions'], season: ['Rabi', 'Winter'], image_hint: 'Small green caterpillars making irregular holes with window-pane damage'
  },
  {
    id: 'cabbage-black-rot', name: 'Black Rot of Cabbage',
    aliases: ['Xanthomonas campestris', 'Crucifer Black Rot'],
    crops: ['Cabbage', 'Cauliflower', 'Broccoli', 'Kale', 'Mustard', 'Radish'],
    type: 'bacteria',
    symptoms: ['Yellow V-shaped lesions at leaf margins', 'Leaf veins turn black (black veins)', 'Leaves turn yellow then brown and dry', 'Plants become stunted', 'Black discoloration of vascular tissue in stem'],
    causes: ['Xanthomonas campestris pv. campestris', 'Infected seeds', 'Survives on crop residue'],
    spread: 'Seed-borne, rain splash, irrigation water, contaminated tools and machinery',
    favorable_conditions: ['Warm humid weather 25-30°C', 'Rainfall', 'Overhead irrigation', 'Plant wounding', 'Continuous crucifer cropping'],
    chemical_control: ['Copper oxychloride 3g/L', 'Streptocycline 1g/10L water', 'Bordeaux mixture 1:1:10', 'Apply at first symptom appearance'],
    biological_control: ['Bacillus subtilis 10g/L', 'Pseudomonas fluorescens 10g/L', 'Garlic extract spray 10ml/L'],
    prevention: ['Use certified disease-free seeds', 'Hot water seed treatment 50°C for 30 min', '3-4 year crop rotation', 'Avoid overhead irrigation', 'Remove infected plants immediately', 'Disinfect tools with bleach solution'],
    severity: 'high', regions: ['India', 'Global crucifer regions'], season: ['Rabi'], image_hint: 'Yellow V-shaped lesions at leaf margins with black veins'
  },
  // ===== GINGER =====
  {
    id: 'ginger-leaf-bloch', name: 'Ginger Leaf Blotch',
    aliases: ['Phyllosticta Leaf Spot', 'Ginger Leaf Spot'],
    crops: ['Ginger', 'Turmeric'],
    type: 'fungus',
    symptoms: ['Long oval spots on leaves (light brown with dark margin)', 'Spots coalesce causing leaf blight', 'Yellowing and drying of leaves', 'Reduced root development', 'Defoliation in severe cases'],
    causes: ['Phyllosticta zingiberi', 'Infected seed rhizomes', 'Plant debris in soil'],
    spread: 'Airborne spores, rain splash, infected seed material',
    favorable_conditions: ['Warm humid weather 25-30°C', 'Extended leaf wetness', 'High rainfall', 'Dense planting', 'Poor drainage'],
    chemical_control: ['Mancozeb 2g/L', 'Carbendazim 1g/L', 'Copper oxychloride 3g/L', 'Difenoconazole 0.5ml/L'],
    biological_control: ['Trichoderma viride 5g/L spray', 'Neem oil 5ml/L', 'Pseudomonas fluorescens 10g/kg seed treatment'],
    prevention: ['Use disease-free seed rhizomes', 'Seed treatment before planting', 'Well-drained raised beds', 'Remove infected leaves', '3-4 year rotation', 'Avoid overhead irrigation'],
    severity: 'medium', regions: ['India', 'Southeast Asia'], season: ['Kharif'], image_hint: 'Long oval brown spots with dark border on ginger leaves'
  },
]

export const CROP_LIST = Array.from(new Set(DISEASE_DATABASE.flatMap(d => d.crops))).filter(c => c !== 'General').sort()

export const DISEASE_TYPES = Array.from(new Set(DISEASE_DATABASE.map(d => d.type))) as string[]

export function getDiseasesByCrop(crop: string): Disease[] {
  const q = crop.toLowerCase()
  return DISEASE_DATABASE.filter(d => d.crops.some(c => c.toLowerCase().includes(q)) || d.crops.includes('General'))
}

export function getDiseaseById(id: string): Disease | undefined {
  return DISEASE_DATABASE.find(d => d.id === id)
}

export function getDiseasesByType(type: string): Disease[] {
  return DISEASE_DATABASE.filter(d => d.type === type)
}

export function searchDiseases(query: string): Disease[] {
  const q = query.toLowerCase()
  return DISEASE_DATABASE.filter(d =>
    d.name.toLowerCase().includes(q) ||
    d.aliases.some(a => a.toLowerCase().includes(q)) ||
    d.symptoms.some(s => s.toLowerCase().includes(q)) ||
    d.crops.some(c => c.toLowerCase().includes(q)) ||
    d.id.toLowerCase().includes(q)
  )
}

export function getDiseaseStats() {
  return {
    total: DISEASE_DATABASE.length,
    byType: Object.fromEntries(
      (Object.entries(Object.groupBy(DISEASE_DATABASE, d => d.type))).map(([k, v]) => [k, (v as Disease[]).length])
    ),
    byCrop: Object.fromEntries(
      CROP_LIST.map(crop => [crop, getDiseasesByCrop(crop).length])
    ),
    severityCounts: Object.fromEntries(
      (Object.entries(Object.groupBy(DISEASE_DATABASE, d => d.severity))).map(([k, v]) => [k, (v as Disease[]).length])
    ),
  }
}
