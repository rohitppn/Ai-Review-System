export type Category = {
  id: string;
  label: string;
  emoji: string;
  tags: string[];
};

export const CATEGORIES: Category[] = [
  { id: "cafe", label: "Cafe / coffee shop", emoji: "☕",
    tags: ["food quality", "coffee", "service", "ambience", "value", "speed"] },
  { id: "restaurant", label: "Restaurant", emoji: "🍽️",
    tags: ["food quality", "service", "ambience", "value", "menu variety", "cleanliness"] },
  { id: "bakery", label: "Bakery / patisserie", emoji: "🥐",
    tags: ["taste", "freshness", "variety", "value", "service", "presentation"] },
  { id: "bar", label: "Bar / pub", emoji: "🍻",
    tags: ["drinks", "atmosphere", "music", "service", "value", "food"] },
  { id: "store", label: "Retail store", emoji: "🛍️",
    tags: ["product quality", "staff", "selection", "value", "cleanliness", "checkout speed"] },
  { id: "boutique", label: "Boutique / fashion", emoji: "👗",
    tags: ["selection", "quality", "staff", "value", "style", "fitting room"] },
  { id: "jewelry", label: "Jewelry", emoji: "💎",
    tags: ["quality", "staff", "selection", "value", "ambience", "trustworthiness"] },
  { id: "electronics", label: "Electronics", emoji: "📱",
    tags: ["product range", "staff knowledge", "price", "service", "warranty support", "store layout"] },
  { id: "grocery", label: "Grocery / supermarket", emoji: "🛒",
    tags: ["freshness", "selection", "price", "staff", "cleanliness", "checkout speed"] },
  { id: "salon", label: "Salon / spa", emoji: "💇",
    tags: ["skill", "friendliness", "cleanliness", "value", "ambience", "results"] },
  { id: "barbershop", label: "Barbershop", emoji: "💈",
    tags: ["skill", "friendliness", "ambience", "value", "cleanliness", "results"] },
  { id: "gym", label: "Gym / fitness center", emoji: "🏋️",
    tags: ["equipment", "trainers", "cleanliness", "atmosphere", "value", "variety"] },
  { id: "studio", label: "Yoga / fitness studio", emoji: "🧘",
    tags: ["instructors", "atmosphere", "cleanliness", "variety", "value", "community"] },
  { id: "hotel", label: "Hotel / lodging", emoji: "🏨",
    tags: ["cleanliness", "comfort", "service", "location", "value", "amenities"] },
  { id: "clinic", label: "Clinic / doctor", emoji: "🏥",
    tags: ["expertise", "wait time", "staff", "cleanliness", "value", "communication"] },
  { id: "dentist", label: "Dentist", emoji: "🦷",
    tags: ["expertise", "comfort", "wait time", "staff", "value", "results"] },
  { id: "pharmacy", label: "Pharmacy", emoji: "💊",
    tags: ["staff", "stock availability", "value", "speed", "cleanliness", "advice"] },
  { id: "auto", label: "Auto repair / wash", emoji: "🚗",
    tags: ["expertise", "honesty", "price", "speed", "communication", "results"] },
  { id: "petstore", label: "Pet store / vet", emoji: "🐾",
    tags: ["staff", "selection", "cleanliness", "expertise", "value", "care"] },
  { id: "other", label: "Other", emoji: "🏪",
    tags: ["service", "quality", "value", "staff", "cleanliness", "experience"] },
];

export function getCategory(id: string): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
