// Suggested SEO keywords per category. Owners can pick from these or add their own.
// Keywords are intentionally generic — owners add their city/area before saving.

export const KEYWORD_SUGGESTIONS: Record<string, string[]> = {
  cafe: ["best coffee", "cozy cafe", "specialty espresso", "breakfast spot", "wifi cafe", "study cafe", "brunch"],
  restaurant: ["best restaurant", "family dining", "good food", "fine dining", "best dinner", "lunch buffet", "romantic dinner"],
  bakery: ["fresh bakery", "best cake", "artisan bread", "birthday cake", "custom cakes", "fresh pastries", "sweets"],
  bar: ["best bar", "happy hour", "craft cocktails", "rooftop bar", "live music", "sports bar", "pub night"],
  store: ["local store", "best prices", "good selection", "trusted shop", "quality products", "friendly staff"],
  boutique: ["boutique fashion", "designer wear", "trendy outfits", "ethnic wear", "wedding shopping", "festival outfit"],
  jewelry: ["best jewelers", "wedding jewelry", "gold shop", "trusted jeweler", "designer jewelry", "diamond shop"],
  electronics: ["electronics store", "best price", "mobile shop", "laptop store", "warranty service", "trusted dealer"],
  grocery: ["fresh grocery", "supermarket", "daily essentials", "best prices", "organic produce", "home delivery"],
  salon: ["best salon", "hair salon", "facial spa", "bridal makeup", "hair coloring", "beauty parlor", "skincare"],
  barbershop: ["best barber", "haircut shop", "beard trim", "salon for men", "hair styling", "skin fade"],
  gym: ["best gym", "fitness center", "personal training", "weight loss", "gym membership", "crossfit", "cardio"],
  studio: ["yoga studio", "fitness classes", "pilates", "zumba classes", "meditation", "weight loss program"],
  hotel: ["best hotel", "budget hotel", "luxury stay", "family hotel", "business hotel", "boutique hotel"],
  clinic: ["best doctor", "family clinic", "health checkup", "general physician", "trusted clinic"],
  dentist: ["best dentist", "dental clinic", "teeth cleaning", "root canal", "braces", "dental implants"],
  pharmacy: ["pharmacy", "medicines", "24 hour pharmacy", "home delivery", "trusted chemist"],
  auto: ["car service", "bike repair", "trusted mechanic", "car wash", "car detailing", "auto shop"],
  petstore: ["pet shop", "pet food", "vet clinic", "dog grooming", "pet supplies", "trusted vet"],
  other: ["best service", "trusted business", "good quality", "friendly staff", "value for money"],
};

export function suggestKeywords(category: string): string[] {
  return KEYWORD_SUGGESTIONS[category] ?? KEYWORD_SUGGESTIONS.other;
}
