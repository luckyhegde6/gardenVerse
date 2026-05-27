from typing import Dict, List, Optional


class DiseaseDatabase:
    def __init__(self) -> None:
        self._diseases: Dict[str, Dict] = {
            "powdery_mildew": {
                "name": "Powdery Mildew",
                "causal_agent": "Erysiphales fungi",
                "type": "fungal",
                "common_hosts": ["cucumber", "squash", "rose", "tomato"],
                "symptoms": [
                    "White powdery coating on leaves",
                    "Yellowing leaf patches",
                    "Distorted or stunted growth",
                    "Premature leaf drop",
                ],
                "causes": [
                    "High humidity (>65%)",
                    "Poor air circulation",
                    "Overcrowding",
                    "Excessive shade",
                ],
                "treatments": [
                    {
                        "method": "neem_oil",
                        "description": "Apply neem oil spray (2ml per liter) every 7 days",
                        "effectiveness": 0.8,
                        "organic": True,
                    },
                    {
                        "method": "baking_soda",
                        "description": "Mix 1 tsp baking soda + 1L water + few drops soap, spray weekly",
                        "effectiveness": 0.6,
                        "organic": True,
                    },
                    {
                        "method": "sulfur_fungicide",
                        "description": "Apply sulfur-based fungicide according to package instructions",
                        "effectiveness": 0.85,
                        "organic": True,
                    },
                    {
                        "method": "remove_infected",
                        "description": "Remove and destroy severely infected leaves",
                        "effectiveness": 0.5,
                        "organic": True,
                    },
                ],
                "prevention": [
                    "Ensure good air circulation",
                    "Water at soil level, not overhead",
                    "Space plants properly",
                    "Use resistant varieties",
                ],
                "severity_thresholds": {
                    "mild": "Less than 25% of leaves affected",
                    "moderate": "25-50% of leaves affected",
                    "severe": "More than 50% of leaves affected",
                },
            },
            "black_spot": {
                "name": "Black Spot",
                "causal_agent": "Diplocarpon rosae",
                "type": "fungal",
                "common_hosts": ["rose"],
                "symptoms": [
                    "Circular black spots on upper leaf surfaces",
                    "Yellow halos around spots",
                    "Premature leaf drop",
                    "Reduced flowering",
                ],
                "causes": [
                    "Wet foliage for extended periods",
                    "Poor air circulation",
                    "Overhead watering",
                    "Infected soil debris",
                ],
                "treatments": [
                    {
                        "method": "remove_leaves",
                        "description": "Remove infected leaves and dispose of them (do not compost)",
                        "effectiveness": 0.6,
                        "organic": True,
                    },
                    {
                        "method": "copper_fungicide",
                        "description": "Apply copper-based fungicide every 7-10 days",
                        "effectiveness": 0.8,
                        "organic": True,
                    },
                    {
                        "method": "sulfur_spray",
                        "description": "Apply wettable sulfur spray at first sign of infection",
                        "effectiveness": 0.75,
                        "organic": True,
                    },
                    {
                        "method": "baking_soda_spray",
                        "description": "1 tbsp baking soda + 1 gal water + 1 tsp horticultural oil",
                        "effectiveness": 0.5,
                        "organic": True,
                    },
                ],
                "prevention": [
                    "Water at soil level in the morning",
                    "Mulch around plants to prevent splash-back",
                    "Prune for air circulation",
                    "Apply dormant spray in winter",
                ],
                "severity_thresholds": {
                    "mild": "Few spots on lower leaves",
                    "moderate": "Spots on middle leaves, some yellowing",
                    "severe": "Extensive spotting, significant defoliation",
                },
            },
            "blight": {
                "name": "Blight (Early Blight)",
                "causal_agent": "Alternaria solani",
                "type": "fungal",
                "common_hosts": ["tomato", "potato", "pepper"],
                "symptoms": [
                    "Dark concentric rings on older leaves",
                    "Yellowing leaf edges",
                    "Stem lesions",
                    "Fruit rot near stem attachment",
                ],
                "causes": [
                    "Warm, wet weather",
                    "Infected seeds or transplants",
                    "Soil splash onto lower leaves",
                    "Cross-contamination from infected plants",
                ],
                "treatments": [
                    {
                        "method": "copper_fungicide",
                        "description": "Apply copper fungicide at first symptoms, repeat every 7-10 days",
                        "effectiveness": 0.7,
                        "organic": True,
                    },
                    {
                        "method": "chlorothalonil",
                        "description": "Apply chlorothalonil-based fungicide following label directions",
                        "effectiveness": 0.85,
                        "organic": False,
                    },
                    {
                        "method": "prune_affected",
                        "description": "Prune off affected lower branches and leaves",
                        "effectiveness": 0.5,
                        "organic": True,
                    },
                    {
                        "method": "crop_rotation",
                        "description": "Rotate out of Solanaceae family for 3-4 years",
                        "effectiveness": 0.9,
                        "organic": True,
                    },
                ],
                "prevention": [
                    "Use disease-free seeds and transplants",
                    "Rotate crops annually",
                    "Provide adequate spacing",
                    "Mulch around plants",
                    "Water at soil level",
                ],
                "severity_thresholds": {
                    "mild": "Lower leaves only affected",
                    "moderate": "Lower to middle canopy affected",
                    "severe": "Widespread defoliation, fruit infected",
                },
            },
            "aphid_infestation": {
                "name": "Aphid Infestation",
                "causal_agent": "Aphidoidea family",
                "type": "pest",
                "common_hosts": ["rose", "tomato", "basil", "pepper", "cucumber"],
                "symptoms": [
                    "Clusters of small insects on new growth",
                    "Sticky honeydew residue on leaves",
                    "Curled, yellowing leaves",
                    "Stunted growth",
                    "Ants crawling on plants",
                ],
                "causes": [
                    "Over-fertilization (excess nitrogen)",
                    "Stress from drought or poor conditions",
                    "Nearby infested plants",
                    "Lack of beneficial insects",
                ],
                "treatments": [
                    {
                        "method": "water_blast",
                        "description": "Blast aphids off with strong water spray",
                        "effectiveness": 0.6,
                        "organic": True,
                    },
                    {
                        "method": "neem_oil",
                        "description": "Apply neem oil spray every 5-7 days",
                        "effectiveness": 0.8,
                        "organic": True,
                    },
                    {
                        "method": "insecticidal_soap",
                        "description": "Spray with insecticidal soap solution",
                        "effectiveness": 0.75,
                        "organic": True,
                    },
                    {
                        "method": "ladybugs",
                        "description": "Introduce lady beetles (Hippodamia convergens)",
                        "effectiveness": 0.9,
                        "organic": True,
                    },
                ],
                "prevention": [
                    "Attract beneficial insects with diverse planting",
                    "Avoid high-nitrogen fertilizers",
                    "Monitor plants regularly",
                    "Use reflective mulch",
                ],
                "severity_thresholds": {
                    "mild": "Few aphids on new growth",
                    "moderate": "Visible colonies, some leaf curling",
                    "severe": "Heavy infestation, sooty mold, plant stress",
                },
            },
            "downy_mildew": {
                "name": "Downy Mildew",
                "causal_agent": "Peronosporaceae family",
                "type": "fungal",
                "common_hosts": ["cucumber", "lettuce", "basil", "grape"],
                "symptoms": [
                    "Angular yellow patches on upper leaf surface",
                    "White to purple fuzzy growth on leaf undersides",
                    "Leaf browning and curling",
                    "Premature leaf drop",
                ],
                "causes": [
                    "Cool, wet conditions (15-20C)",
                    "High humidity",
                    "Leaf wetness for extended periods",
                    "Overhead irrigation",
                ],
                "treatments": [
                    {
                        "method": "copper_fungicide",
                        "description": "Apply copper fungicide preventatively",
                        "effectiveness": 0.7,
                        "organic": True,
                    },
                    {
                        "method": "phosphorous_acid",
                        "description": "Apply phosphorous acid fungicide",
                        "effectiveness": 0.8,
                        "organic": False,
                    },
                    {
                        "method": "improve_airflow",
                        "description": "Increase spacing and prune for ventilation",
                        "effectiveness": 0.5,
                        "organic": True,
                    },
                ],
                "prevention": [
                    "Water in the morning",
                    "Use drip irrigation",
                    "Plant resistant varieties",
                    "Avoid overhead watering",
                ],
                "severity_thresholds": {
                    "mild": "Few leaf patches affected",
                    "moderate": "Multiple leaves showing symptoms",
                    "severe": "Extensive defoliation, yield loss",
                },
            },
            "spider_mite": {
                "name": "Spider Mite Infestation",
                "causal_agent": "Tetranychus urticae",
                "type": "pest",
                "common_hosts": ["rose", "tomato", "cucumber", "marigold"],
                "symptoms": [
                    "Fine webbing on leaf undersides",
                    "Speckled yellow/stippled leaves",
                    "Leaf bronzing and drying",
                    "Tiny moving dots on webbing",
                ],
                "causes": [
                    "Hot, dry conditions",
                    "Dusty leaves",
                    "Water-stressed plants",
                    "Overuse of broad-spectrum pesticides",
                ],
                "treatments": [
                    {
                        "method": "water_mist",
                        "description": "Regularly mist plants to increase humidity",
                        "effectiveness": 0.5,
                        "organic": True,
                    },
                    {
                        "method": "neem_oil",
                        "description": "Apply neem oil spray thoroughly to leaf undersides",
                        "effectiveness": 0.8,
                        "organic": True,
                    },
                    {
                        "method": "predatory_mites",
                        "description": "Introduce Phytoseiulus persimilis predatory mites",
                        "effectiveness": 0.9,
                        "organic": True,
                    },
                    {
                        "method": "insecticidal_soap",
                        "description": "Apply insecticidal soap, covering undersides of leaves",
                        "effectiveness": 0.7,
                        "organic": True,
                    },
                ],
                "prevention": [
                    "Maintain adequate humidity",
                    "Keep plants well-watered",
                    "Dust leaves periodically with water spray",
                    "Avoid broad-spectrum insecticides",
                ],
                "severity_thresholds": {
                    "mild": "Little webbing, few stippled leaves",
                    "moderate": "Visible webbing, yellowing leaves",
                    "severe": "Heavy webbing covering leaves, plant decline",
                },
            },
            "blossom_end_rot": {
                "name": "Blossom End Rot",
                "causal_agent": "Calcium deficiency (physiological)",
                "type": "physiological",
                "common_hosts": ["tomato", "bell_pepper", "aubergine"],
                "symptoms": [
                    "Water-soaked spots on blossom end of fruit",
                    "Dark, sunken lesions enlarging over time",
                    "Fruit ripening prematurely",
                    "Secondary fungal infection on lesions",
                ],
                "causes": [
                    "Calcium deficiency in soil",
                    "Inconsistent watering (wet/dry cycles)",
                    "Excess nitrogen fertilization",
                    "Root damage restricting uptake",
                    "High soil salinity",
                ],
                "treatments": [
                    {
                        "method": "consistent_watering",
                        "description": "Maintain even soil moisture, mulch to retain water",
                        "effectiveness": 0.8,
                        "organic": True,
                    },
                    {
                        "method": "calcium_supplement",
                        "description": "Apply calcium-rich foliar spray or bone meal to soil",
                        "effectiveness": 0.6,
                        "organic": True,
                    },
                    {
                        "method": "ph_adjustment",
                        "description": "Adjust soil pH to 6.2-6.8 for optimal calcium uptake",
                        "effectiveness": 0.7,
                        "organic": True,
                    },
                    {
                        "method": "remove_affected",
                        "description": "Remove affected fruit to redirect energy",
                        "effectiveness": 0.4,
                        "organic": True,
                    },
                ],
                "prevention": [
                    "Maintain consistent watering schedule",
                    "Test and amend soil calcium levels before planting",
                    "Avoid excessive nitrogen fertilization",
                    "Mulch to maintain even soil moisture",
                ],
                "severity_thresholds": {
                    "mild": "Small spot on 1-2 fruits",
                    "moderate": "Larger lesions on several fruits",
                    "severe": "Most fruits affected, significant crop loss",
                },
            },
            "rust": {
                "name": "Rust",
                "causal_agent": "Pucciniales order",
                "type": "fungal",
                "common_hosts": ["rose", "sunflower", "bean"],
                "symptoms": [
                    "Orange, yellow, or brown pustules on leaf undersides",
                    "Corresponding yellow spots on upper leaf surface",
                    "Leaf distortion and premature drop",
                    "Stem cankers in severe cases",
                ],
                "causes": [
                    "Wet, humid conditions",
                    "Poor air circulation",
                    "Overcrowding",
                    "Infested plant debris",
                ],
                "treatments": [
                    {
                        "method": "remove_infected",
                        "description": "Remove and destroy infected leaves immediately",
                        "effectiveness": 0.5,
                        "organic": True,
                    },
                    {
                        "method": "sulfur_fungicide",
                        "description": "Apply sulfur-based fungicide every 7-14 days",
                        "effectiveness": 0.75,
                        "organic": True,
                    },
                    {
                        "method": "copper_fungicide",
                        "description": "Apply copper fungicide at first sign",
                        "effectiveness": 0.7,
                        "organic": True,
                    },
                    {
                        "method": "myclobutanil",
                        "description": "Apply systemic fungicide for severe cases",
                        "effectiveness": 0.85,
                        "organic": False,
                    },
                ],
                "prevention": [
                    "Plant resistant varieties",
                    "Ensure good spacing and air flow",
                    "Water at soil level",
                    "Clean up fallen debris",
                    "Avoid working with wet plants",
                ],
                "severity_thresholds": {
                    "mild": "Few pustules on lower leaves",
                    "moderate": "Pustules spreading, some leaf yellowing",
                    "severe": "Extensive pustules, defoliation, plant weakened",
                },
            },
        }

    def get_disease(self, name: str) -> Optional[Dict]:
        key = name.lower().replace(" ", "_")
        return self._diseases.get(key)

    def get_all_diseases(self) -> Dict[str, Dict]:
        return dict(self._diseases)

    def get_diseases_for_plant(self, plant_species: str) -> List[Dict]:
        q = plant_species.lower().replace(" ", "_")
        results = []
        for disease_key, info in self._diseases.items():
            hosts = [h.lower() for h in info["common_hosts"]]
            if q in hosts:
                results.append({"disease_key": disease_key, **info})
        return results

    def search(self, query: str) -> List[Dict]:
        q = query.lower()
        results = []
        for key, info in self._diseases.items():
            if (
                q in key
                or q in info["name"].lower()
                or q in info["causal_agent"].lower()
            ):
                results.append({"disease_key": key, **info})
        return results

    def get_treatments_for_disease(
        self, disease_name: str
    ) -> Optional[List[Dict]]:
        disease = self.get_disease(disease_name)
        if not disease:
            return None
        return disease.get("treatments", [])

    def get_prevention_tips(self, disease_name: str) -> Optional[List[str]]:
        disease = self.get_disease(disease_name)
        if not disease:
            return None
        return disease.get("prevention", [])
