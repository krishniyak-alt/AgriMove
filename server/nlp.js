import { GoogleGenerativeAI } from "@google/generative-ai";

const TAMIL_CROPS = {
  "தக்காளி": "Tomato",
  "தக்காளிப் பழம்": "Tomato",
  "உருளைக்கிழங்கு": "Potato",
  "உருளை": "Potato",
  "வெங்காயம்": "Onion",
  "பூண்டு": "Garlic",
  "இஞ்சி": "Ginger",
  "கத்தரிக்காய்": "Brinjal",
  "நெல்": "Paddy",
  "அரிசி": "Rice",
  "கோதுமை": "Wheat",
  "மாம்பழம்": "Mango",
  "மாங்காய்": "Mango",
  "வாழைக்காய்": "Banana Raw",
  "வாழைப்பழம்": "Banana",
  "வாழை": "Banana",
  "தேங்காய்": "Coconut",
  "மிளகாய்": "Chilli",
  "முருங்கைக்காய்": "Drumstick",
  "கேரட்": "Carrot",
  "முட்டைக்கோஸ்": "Cabbage",
  "கீரை": "Spinach"
};

const TAMIL_LOCATIONS = {
  "தஞ்சாவூர்": "Thanjavur",
  "தஞ்சை": "Thanjavur",
  "சென்னை": "Chennai",
  "மதுரை": "Madurai",
  "திருச்சி": "Trichy",
  "திருச்சிராப்பள்ளி": "Trichy",
  "கோவை": "Coimbatore",
  "கோயம்புத்தூர்": "Coimbatore",
  "சேலம்": "Salem",
  "நெல்லை": "Tirunelveli",
  "திருநெல்வேலி": "Tirunelveli",
  "ஈரோடு": "Erode",
  "வேலூர்": "Vellore",
  "தூத்துக்குடி": "Tuticorin",
  "கன்னியாகுமரி": "Kanyakumari",
  "கும்பகோணம்": "Kumbakonam",
  "திருப்பூர்": "Tiruppur",
  "தர்மபுரி": "Dharmapuri",
  "கடலூர்": "Cuddalore",
  "திண்டுக்கல்": "Dindigul",
  "காஞ்சிபுரம்": "Kanchipuram",
  "கரூர்": "Karur",
  "கிருஷ்ணகிரி": "Krishnagiri",
  "நாகப்பட்டினம்": "Nagapattinam",
  "நாமக்கல்": "Namakkal",
  "நீலகிரி": "Nilgiris",
  "ஊட்டி": "Ooty",
  "பெரம்பலூர்": "Perambalur",
  "புதுக்கோட்டை": "Pudukkottai",
  "ராமநாதபுரம்": "Ramanathapuram",
  "இராமநாதபுரம்": "Ramanathapuram",
  "சிவகங்கை": "Sivaganga",
  "தேனி": "Theni",
  "திருப்பத்தூர்": "Tirupathur",
  "திருவள்ளூர்": "Tiruvallur",
  "திருவண்ணாமலை": "Tiruvannamalai",
  "திருவாரூர்": "Tiruvarur",
  "விழுப்புரம்": "Viluppuram",
  "விருதுநகர்": "Virudhunagar",
  "தென்காசி": "Tenkasi",
  "ராணிப்பேட்டை": "Ranipet",
  "இராணிப்பேட்டை": "Ranipet",
  "கள்ளக்குறிச்சி": "Kallakurichi",
  "செங்கல்பட்டு": "Chengalpattu",
  "மயிலாடுதுறை": "Mayiladuthurai",
  "அரியலூர்": "Ariyalur",
  "அரக்கோணம்": "Arakkonam",
  "மார்க்கெட்": "Market",
  "கோயம்பேடு": "Koyambedu",
  "ஒட்டன்சத்திரம்": "Oddanchatram"
};

// Simple Tamil transliteration / translation helper for unknown words
function translateWordSimple(word) {
  // Check if we have standard maps
  const cropMatch = Object.keys(TAMIL_CROPS).find(k => word.includes(k));
  if (cropMatch) return TAMIL_CROPS[cropMatch];

  const locMatch = Object.keys(TAMIL_LOCATIONS).find(k => word.includes(k));
  if (locMatch) return TAMIL_LOCATIONS[locMatch];

  // Basic fallback
  return word;
}

/**
 * Parses Tamil text using rule-based heuristics
 */
export function parseTamilTextHeuristically(text) {
  let cropTamil = "";
  let cropEnglish = "Vegetables";
  let sourceTamil = "";
  let sourceEnglish = "Farm";
  let destinationTamil = "";
  let destinationEnglish = "Market";
  let quantity = 100; // default quantity
  let quantityUnit = "kg";

  // 1. Extract Crop
  for (const [tamil, english] of Object.entries(TAMIL_CROPS)) {
    if (text.includes(tamil)) {
      cropTamil = tamil;
      cropEnglish = english;
      break;
    }
  }

  // Predefined grammatical roots and spelling variations for Tamil locations
  const LOCATION_PATTERNS = {
    "தஞ்சாவூர்": ["தஞ்சாவூர்", "தஞ்சாவூரி", "தஞ்சாவூர"],
    "தஞ்சை": ["தஞ்சை", "தஞ்சையி"],
    "சென்னை": ["சென்னை", "சென்னையி"],
    "மதுரை": ["மதுரை", "மதுரையி"],
    "திருச்சி": ["திருச்சி", "திருச்சியி"],
    "திருச்சிராப்பள்ளி": ["திருச்சிராப்பள்ளி", "திருச்சிராப்பள்ளியி"],
    "கோவை": ["கோவை", "கோவையி"],
    "கோயம்புத்தூர்": ["கோயம்புத்தூர்", "கோயம்புத்தூரி", "கோயம்புத்தூர"],
    "சேலம்": ["சேலம்", "சேலத்தி", "சேலத்து"],
    "நெல்லை": ["நெல்லை", "நெல்லையி"],
    "திருநெல்வேலி": ["திருநெல்வேலி", "திருநெல்வேலியி"],
    "ஈரோடு": ["ஈரோடு", "ஈரோட்டி"],
    "வேலூர்": ["வேலூர்", "வேலூரி", "வேலூர"],
    "தூத்துக்குடி": ["தூத்துக்குடி", "தூத்துக்குடியி"],
    "கன்னியாகுமரி": ["கன்னியாகுமரி", "கன்னியாகுமரியி"],
    "கும்பகோணம்": ["கும்பகோணம்", "கும்பகோணத்தி", "கும்பகோணத்து"],
    "திருப்பூர்": ["திருப்பூர்", "திருப்பூரி", "திருப்பூர"],
    "தர்மபுரி": ["தர்மபுரி", "தர்மபுரியி"],
    "கடலூர்": ["கடலூர்", "கடலூரி", "கடலூர"],
    "திண்டுக்கல்": ["திண்டுக்கல்", "திண்டுக்கல்லி"],
    "காஞ்சிபுரம்": ["காஞ்சிபுரம்", "காஞ்சிபுரத்தி", "காஞ்சிபுரத்து"],
    "கரூர்": ["கரூர்", "கரூரி", "கரூர"],
    "கிருஷ்ணகிரி": ["கிருஷ்ணகிரி", "கிருஷ்ணகிரியி"],
    "நாகப்பட்டினம்": ["நாகப்பட்டினம்", "நாகப்பட்டினத்தி", "நாகப்பட்டினத்து"],
    "நாமக்கல்": ["நாமக்கல்", "நாமக்கல்லி"],
    "நீலகிரி": ["நீலகிரி", "நீலகிரியி"],
    "ஊட்டி": ["ஊட்டி", "ஊட்டியி"],
    "பெரம்பலூர்": ["பெரம்பலூர்", "பெரம்பலூரி", "பெரம்பலூர"],
    "புதுக்கோட்டை": ["புதுக்கோட்டை", "புதுக்கோட்டையி"],
    "ராமநாதபுரம்": ["ராமநாதபுரம்", "ராமநாதபுரத்தி", "ராமநாதபுரத்து"],
    "இராமநாதபுரம்": ["இராமநாதபுரம்", "இராமநாதபுரத்தி", "இராமநாதபுரத்து"],
    "சிவகங்கை": ["சிவகங்கை", "சிவகங்கையி"],
    "தேனி": ["தேனி", "தேனியி"],
    "திருப்பத்தூர்": ["திருப்பத்தூர்", "திருப்பத்தூரி", "திருப்பத்தூர"],
    "திருவள்ளூர்": ["திருவள்ளூர்", "திருவள்ளூரி", "திருவள்ளூர"],
    "திருவண்ணாமலை": ["திருவண்ணாமலை", "திருவண்ணாமலையி"],
    "திருவாரூர்": ["திருவாரூர்", "திருவாரூரி", "திருவாரூர"],
    "விழுப்புரம்": ["விழுப்புரம்", "விழுப்புரத்தி", "விழுப்புரத்து"],
    "விருதுநகர்": ["விருதுநகர்", "விருதுநகரி"],
    "தென்காசி": ["தென்காசி", "தென்காசியி"],
    "ராணிப்பேட்டை": ["ராணிப்பேட்டை", "ராணிப்பேட்டையி"],
    "இராணிப்பேட்டை": ["இராணிப்பேட்டை", "இராணிப்பேட்டையி"],
    "கள்ளக்குறிச்சி": ["கள்ளக்குறிச்சி", "கள்ளக்குறிச்சியி"],
    "செங்கல்பட்டு": ["செங்கல்பட்டு", "செங்கல்பட்டி"],
    "மயிலாடுதுறை": ["மயிலாடுதுறை", "மயிலாடுதுறையி"],
    "அரியலூர்": ["அரியலூர்", "அரியலூரி", "அரியலூர"],
    "அரக்கோணம்": ["அரக்கோணம்", "அரக்கோணத்தி", "அரக்கோணத்து"],
    "மார்க்கெட்": ["மார்க்கெட்", "மார்க்கெட்டி", "மார்க்கெட்டு"],
    "கோயம்பேடு": ["கோயம்பேடு", "கோயம்பேட்டி"],
    "ஒட்டன்சத்திரம்": ["ஒட்டன்சத்திரம்", "ஒட்டன்சத்திரத்தி", "ஒட்டன்சத்திரத்து"]
  };

  // 2. Extract Locations
  for (const [tamil, english] of Object.entries(TAMIL_LOCATIONS)) {
    const variations = LOCATION_PATTERNS[tamil] || [tamil];

    // Check if any variation matches in the text
    for (const v of variations) {
      if (text.includes(`${v}ிலிருந்து`) || text.includes(`${v}லிருந்து`) || text.includes(`${v} இருந்து`) || text.includes(`${v}ல இருந்து`)) {
        sourceTamil = tamil;
        sourceEnglish = english;
        break;
      } else if (text.includes(`${v}ுக்கு`) || text.includes(`${v}க்கு`) || text.includes(`${v}ுகு`) || text.includes(`${v}கு`)) {
        destinationTamil = tamil;
        destinationEnglish = english;
        break;
      } else if (text.includes(v)) {
        if (!sourceTamil) {
          sourceTamil = tamil;
          sourceEnglish = english;
        } else if (!destinationTamil && tamil !== sourceTamil) {
          destinationTamil = tamil;
          destinationEnglish = english;
        }
      }
    }
  }

  // Dynamic fallback regex matching for unspecified Tamil locations
  if (!sourceTamil) {
    const sourceRegex = /(\S+?)(?:\s+இலிருந்து|\s+லிருந்து|ிலிருந்து|லிருந்து| இருந்து|ல இருந்து)(?:\s|$)/;
    const match = text.match(sourceRegex);
    if (match) {
      let extracted = match[1].trim();
      if (extracted.endsWith("ய") || extracted.endsWith("வ")) {
        extracted = extracted.slice(0, -1);
      }
      if (extracted.length > 1) {
        sourceTamil = extracted;
        sourceEnglish = translateWordSimple(extracted);
      }
    }
  }

  if (!destinationTamil) {
    const destRegex = /(\S+?)(?:\s+உக்கு|\s+க்கு|ுக்கு|க்கு|ுகு|கு| நோக்கி|க்கு போகும்)(?:\s|$)/;
    const match = text.match(destRegex);
    if (match) {
      let extracted = match[1].trim();
      if (extracted.endsWith("ய") || extracted.endsWith("வ")) {
        extracted = extracted.slice(0, -1);
      }
      if (extracted.length > 1 && extracted !== sourceTamil) {
        destinationTamil = extracted;
        destinationEnglish = translateWordSimple(extracted);
      }
    }
  }

  // Fallbacks if not detected specifically
  if (!sourceTamil) {
    sourceTamil = "தஞ்சாவூர்"; // Default source
    sourceEnglish = "Thanjavur";
  }
  if (!destinationTamil) {
    destinationTamil = "மார்க்கெட்"; // Default destination
    destinationEnglish = "Market";
  }
  if (!cropTamil) {
    cropTamil = "தக்காளி";
    cropEnglish = "Tomato";
  }

  // 3. Extract Quantity
  // Find numbers followed by unit words
  const quantityRegex = /(\d+)\s*(கிலோ|மூட்டை|டன்|kg|bags|tons|கிகி|க்ராம்)/i;
  const match = text.match(quantityRegex);
  if (match) {
    quantity = parseInt(match[1], 10);
    const unitText = match[2];
    if (unitText.includes("மூட்டை") || unitText.includes("bag")) {
      quantityUnit = "bags";
      // Convert bags to kg roughly (e.g. 50kg per bag)
      quantity = quantity * 50;
    } else if (unitText.includes("டன்") || unitText.includes("ton")) {
      quantityUnit = "tons";
      quantity = quantity * 1000;
    } else {
      quantityUnit = "kg";
    }
  } else {
    // Look for any number
    const numberRegex = /(\d+)/;
    const numMatch = text.match(numberRegex);
    if (numMatch) {
      quantity = parseInt(numMatch[1], 10);
    }
  }

  return {
    cropTamil,
    cropEnglish,
    sourceTamil,
    sourceEnglish,
    destinationTamil,
    destinationEnglish,
    quantity,
    quantityUnit,
    parsedMethod: "heuristic"
  };
}

/**
 * Core Parser: Uses Gemini if API key is provided, else falls back to local rules
 */
export async function parseTamilProduceRequest(text, apiKey = process.env.GEMINI_API_KEY) {
  if (!text || text.trim() === "") {
    return parseTamilTextHeuristically("");
  }

  if (!apiKey) {
    return parseTamilTextHeuristically(text);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this Tamil text requesting transport of agricultural produce. Extract the crop type, source location, destination location, and quantity.
Return the result strictly as a JSON object, with no markdown styling or code wrappers, just the raw JSON. The response MUST map exactly to the following keys:
- cropTamil: string (crop name in Tamil)
- cropEnglish: string (crop name translated/transliterated to English)
- sourceTamil: string (source location in Tamil)
- sourceEnglish: string (source location translated/transliterated to English)
- destinationTamil: string (destination location in Tamil)
- destinationEnglish: string (destination location translated/transliterated to English)
- quantity: number (quantity in kilograms, extract numeric value, convert units like bags/tons to kg: 1 bag = 50kg, 1 ton = 1000kg. Fallback to 100 if unspecified)
- quantityUnit: string (original unit extracted, e.g. "kg", "bags", "tons")

Input Text: "${text}"`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Clean up potential markdown code block backticks
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const parsed = JSON.parse(cleanedText);
    return {
      ...parsed,
      parsedMethod: "gemini-ai"
    };
  } catch (err) {
    console.error("Gemini Parsing failed, falling back to heuristics:", err);
    return parseTamilTextHeuristically(text);
  }
}
