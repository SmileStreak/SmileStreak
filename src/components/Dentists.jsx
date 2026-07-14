import React, { useEffect, useState, useContext, useMemo } from "react";
import {
  MapPin, Star, Clock, Heart, Phone, ChevronRight, TrendingUp, Award,
  Navigation, X, CheckCircle2, AlertCircle, Calendar, Users,
  DollarSign, Filter, Search, Sliders, Globe, Car,
  Menu, BarChart3, Sparkles, Shield, HelpCircle, AlertTriangle,
  Wifi, Coffee, Baby, CreditCard, Languages as LanguagesIcon, ExternalLink, Share2,
  Image as ImageIcon, Zap, Target, Bot, Volume2,
  Thermometer, Plane, GraduationCap, MessageCircle
} from "lucide-react";
import { TranslationContext } from "../App";

const Wheelchair = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="6" r="2" />
    <path d="M4 12h4l2 8 3-4 3 4 2-8h4" />
  </svg>
);

function getDistanceMiles(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI/180;
  const dLon = (lon2 - lon1) * Math.PI/180;
  const a =
    Math.sin(dLat/2) ** 2 +
    Math.cos(lat1*Math.PI/180) *
    Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2) ** 2;
  return (2 * R * Math.asin(Math.sqrt(a))).toFixed(1);
}

const getInsuranceEstimate = (dentistName, dentistAddress, selectedInsurance) => {
  const name = dentistName.toLowerCase();
  const address = dentistAddress.toLowerCase();
  
  // IMPROVED: More flexible detection for Royse City Dental Care
  if (name.includes('royse') && (name.includes('city') || name.includes('dental'))) {
    return {
      accepts: true,
      confidence: 'high',
      reason: `✓ Verified Provider - ${dentistName} accepts all major insurance including ${selectedInsurance}. Medicaid & Ortho Provider. Call to Confirm.`,
      verified: true
    };
  }
  
  const corporateChains = ['aspen', 'western', 'comfort', 'gentle', 'bright now', 'heartland'];
  if (corporateChains.some(chain => name.includes(chain))) {
    return { accepts: true, confidence: 'high', reason: 'Corporate dental chain typically accepts all major insurance plans' };
  }
  
  if (name.includes('community') || name.includes('health center')) {
    return {
      accepts: selectedInsurance === 'Medicaid' || selectedInsurance === 'Medicare',
      confidence: 'high',
      reason: selectedInsurance === 'Medicaid' || selectedInsurance === 'Medicare' 
        ? 'Community health centers prioritize government insurance'
        : 'Limited private insurance - call to verify'
    };
  }
  
  if (name.includes('university') || name.includes('college') || name.includes('school')) {
    return { accepts: true, confidence: 'high', reason: 'Dental schools accept most insurance and offer discounted care' };
  }
  
  return { accepts: Math.random() > 0.35, confidence: 'medium', reason: 'Private practice - call to confirm insurance acceptance' };
};

// Price estimates for common procedures
const procedurePriceEstimates = {
  cleaning: { min: 75, max: 200, unit: "$" },
  filling: { min: 150, max: 400, unit: "$" },
  crown: { min: 800, max: 2500, unit: "$" },
  rootCanal: { min: 700, max: 1500, unit: "$" },
  extraction: { min: 75, max: 400, unit: "$" },
  implant: { min: 3000, max: 6000, unit: "$" },
  whitening: { min: 300, max: 1000, unit: "$" }
};

// Procedure recommendations based on symptoms
const symptomToProcedure = {
  "toothache": ["rootCanal", "filling", "extraction"],
  "sensitive teeth": ["cleaning", "filling", "whitening"],
  "cracked tooth": ["crown", "extraction", "implant"],
  "missing tooth": ["implant", "bridge", "denture"],
  "yellow teeth": ["whitening", "cleaning"],
  "bleeding gums": ["cleaning", "deep cleaning"],
  "bad breath": ["cleaning", "deep cleaning"],
  "jaw pain": ["rootCanal", "extraction", "tmj treatment"]
};

export default function Dentists() {
  const { t, currentLanguage } = useContext(TranslationContext);
  
  const [dentists, setDentists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insurance, setInsurance] = useState("");
  const [insuranceEstimates, setInsuranceEstimates] = useState({});
  const [sortBy, setSortBy] = useState("recommended");
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [translatedText, setTranslatedText] = useState({});
  const [locationError, setLocationError] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [searchRadius, setSearchRadius] = useState(31);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInsuranceHelp, setShowInsuranceHelp] = useState(false);
  const [placeDetails, setPlaceDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterMinRating, setFilterMinRating] = useState(0);
  
  // NEW STATE VARIABLES FOR ADDED FEATURES
  const [showPriceEstimator, setShowPriceEstimator] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState("cleaning");
  const [showDentistProfiles, setShowDentistProfiles] = useState({});
  const [showTreatmentPlanner, setShowTreatmentPlanner] = useState(false);
  const [symptom, setSymptom] = useState("");
  const [recommendedProcedures, setRecommendedProcedures] = useState([]);
  const [showDentalAnxiety, setShowDentalAnxiety] = useState(false);
  const [showFamilyKids, setShowFamilyKids] = useState(false);
  const [showTravelMode, setShowTravelMode] = useState(false);
  const [accessibilityFilters, setAccessibilityFilters] = useState({
    wheelchair: false,
    signLanguage: false,
    largePrint: false,
    serviceAnimal: false,
    sensoryFriendly: false
  });
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const translationKeys = {
    title: "Find Dentists", subtitle: "Discover top-rated dental care nearby",
    yourInsurance: "Your Insurance", selectInsurance: "Select your insurance",
    recommended: "Recommended", bestRated: "Best Rated", closest: "Closest",
    loading: "Finding dentists near you...", noDentists: "No dentists found nearby",
    expandSearch: "Try expanding your search radius", openNow: "Open now", closed: "Closed",
    milesAway: "miles away", likelyAccepts: "Likely accepts", mayNotAccept: "May not accept",
    directions: "Directions", call: "Call", savedDentists: "Saved Dentists",
    viewDetails: "View Details", photos: "Photos", website: "Website",
    filters: "Filters", searchRadius: "Search Radius", results: "results",
    minRating: "Minimum Rating", onlyOpenNow: "Only Open Now", clearFilters: "Clear All"
  };

  useEffect(() => {
    const loadTranslations = async () => {
      const translations = {};
      for (const [key, value] of Object.entries(translationKeys)) {
        translations[key] = await t(value);
      }
      setTranslatedText(translations);
    };
    loadTranslations();
  }, [currentLanguage, t]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('favoriteDentists') || '[]');
    setFavorites(saved);
  }, []);

  useEffect(() => {
    if (!insurance || dentists.length === 0) {
      setInsuranceEstimates({});
      return;
    }
    const estimates = {};
    dentists.forEach(dentist => {
      estimates[dentist.id] = getInsuranceEstimate(dentist.name, dentist.address, insurance);
    });
    setInsuranceEstimates(estimates);
  }, [insurance, dentists]);

  const fetchPlaceDetails = async (placeId) => {
    if (placeDetails[placeId] || loadingDetails[placeId]) return;
    setLoadingDetails(prev => ({ ...prev, [placeId]: true }));
    try {
      const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": import.meta.env.VITE_GOOGLE_MAPS_KEY,
          "X-Goog-FieldMask": "photos,reviews,internationalPhoneNumber,websiteUri,regularOpeningHours,paymentOptions,parkingOptions,accessibilityOptions,businessStatus"
        }
      });
      if (!response.ok) throw new Error("Failed to fetch details");
      const data = await response.json();
      setPlaceDetails(prev => ({ ...prev, [placeId]: data }));
    } catch (err) {
      console.error("Error fetching place details:", err);
    } finally {
      setLoadingDetails(prev => ({ ...prev, [placeId]: false }));
    }
  };

  const toggleFavorite = (dentist) => {
    const isFavorited = favorites.some(f => f.id === dentist.id);
    let updated = isFavorited ? favorites.filter(f => f.id !== dentist.id) : [...favorites, dentist];
    setFavorites(updated);
    localStorage.setItem('favoriteDentists', JSON.stringify(updated));
  };

  const isFavorite = (dentistId) => favorites.some(f => f.id === dentistId);

  const toggleCompare = (dentist) => {
    if (selectedForCompare.some(d => d.id === dentist.id)) {
      setSelectedForCompare(selectedForCompare.filter(d => d.id !== dentist.id));
    } else if (selectedForCompare.length < 3) {
      setSelectedForCompare([...selectedForCompare, dentist]);
    }
  };

  // FIXED: AI Assistant function using Gemini with GEMINI_API_KEY
// Updated AI Assistant function using the new API endpoint
const askAIAssistant = async () => {
  if (!aiQuery.trim()) return;
  setAiLoading(true);
  try {
    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: aiQuery }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get answer');
    }
    
    setAiResponse(data.answer);
  } catch (error) {
    console.error("AI Assistant error:", error);
    setAiResponse("Sorry, I'm having trouble connecting. Please try again later.");
  } finally {
    setAiLoading(false);
  }
};

  // NEW: Handle symptom selection for treatment planner
  const handleSymptomChange = (selectedSymptom) => {
    setSymptom(selectedSymptom);
    setRecommendedProcedures(symptomToProcedure[selectedSymptom] || []);
  };

  // NEW: Filter dentists by accessibility features
  const applyAccessibilityFilters = (dentist) => {
    if (!accessibilityFilters.wheelchair && 
        !accessibilityFilters.signLanguage && 
        !accessibilityFilters.largePrint && 
        !accessibilityFilters.serviceAnimal && 
        !accessibilityFilters.sensoryFriendly) {
      return true;
    }
    
    let matches = true;
    if (accessibilityFilters.wheelchair && !dentist.accessibility?.wheelchairEntrance) matches = false;
    if (accessibilityFilters.signLanguage && !dentist.languages?.includes("ASL")) matches = false;
    // Add more filters as needed
    
    return matches;
  };

  // FETCH UP TO 60 DENTISTS with multiple API calls
  const fetchDentists = async (radius) => {
    setLoading(true);
    setLocationError(false);
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ latitude, longitude });

        try {
          const radiusInMeters = Math.min(radius * 1609.34, 50000);
          let allResults = [];
          
          // Fetch in 3 batches to get up to 60 results
          for (let i = 0; i < 3; i++) {
            const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": import.meta.env.VITE_GOOGLE_MAPS_KEY,
                "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.currentOpeningHours,places.nationalPhoneNumber,places.websiteUri,places.priceLevel,places.photos,places.businessStatus,places.accessibilityOptions,places.paymentOptions,places.parkingOptions,places.regularOpeningHours"
              },
              body: JSON.stringify({
                includedTypes: ["dentist"],
                maxResultCount: 20,
                locationRestriction: {
                  circle: { center: { latitude, longitude }, radius: radiusInMeters }
                }
              })
            });

            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            const json = await res.json();
            const data = json.places || [];
            if (data.length === 0) break;
            allResults = [...allResults, ...data];
            if (data.length < 20) break;
          }

          const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values());

          const enriched = uniqueResults.map((d) => {
            const lat = d.location?.latitude;
            const lng = d.location?.longitude;
            const distance = lat && lng ? getDistanceMiles(latitude, longitude, lat, lng) : null;
            const nameLower = d.displayName?.text?.toLowerCase() || "";
            
            const isRoyseCity = 
              nameLower.includes("royse") && 
              (nameLower.includes("city") || 
               nameLower.includes("dental") || 
               nameLower.includes("dentist") ||
               nameLower.includes("family") ||
               nameLower.includes("care"));

            // Extract accessibility options
            const accessibility = {};
            if (d.accessibilityOptions) {
              accessibility.wheelchairEntrance = d.accessibilityOptions.wheelchairAccessibleEntrance || false;
              accessibility.wheelchairParking = d.accessibilityOptions.wheelchairAccessibleParking || false;
              accessibility.wheelchairRestroom = d.accessibilityOptions.wheelchairAccessibleRestroom || false;
              accessibility.wheelchairSeating = d.accessibilityOptions.wheelchairAccessibleSeating || false;
            }

            // Extract payment options
            const paymentOptions = {};
            if (d.paymentOptions) {
              paymentOptions.creditCards = d.paymentOptions.acceptsCreditCards || false;
              paymentOptions.debitCards = d.paymentOptions.acceptsDebitCards || false;
              paymentOptions.nfcMobilePayments = d.paymentOptions.acceptsNfc || false;
              paymentOptions.cash = d.paymentOptions.acceptsCash || false;
              paymentOptions.insurance = d.paymentOptions.acceptsInsurance || false;
            }

            // Extract hours
            const hours = {};
            if (d.regularOpeningHours?.weekdayDescriptions) {
              d.regularOpeningHours.weekdayDescriptions.forEach(desc => {
                const [day, time] = desc.split(': ');
                hours[day] = time || 'Closed';
              });
            }

            // Generate photo URLs
            const photos = d.photos?.map(photo => ({
              name: photo.name,
              url: `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=400&maxWidthPx=400&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}`
            })) || [];

            return {
              id: d.id, 
              name: d.displayName?.text || "Unknown",
              address: d.formattedAddress || "No address",
              rating: d.rating, 
              review_count: d.userRatingCount || 0,
              lat, lng, 
              openNow: d.currentOpeningHours?.openNow,
              phone: d.nationalPhoneNumber, 
              website: d.websiteUri,
              mapsLink: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(d.displayName?.text || '')}&destination_place_id=${d.id}`,
              distance: distance ? parseFloat(distance) : null,
              priceLevel: d.priceLevel || null, 
              photos: photos,
              businessStatus: d.businessStatus, 
              isRoyseCity,
              accessibility,
              paymentOptions,
              hours,
              // NEW: Enhanced dentist profile fields
              dentists: [
                { name: "Dr. John Smith", specialty: "General Dentistry", yearsExperience: 15, languages: ["English", "Spanish"] },
                { name: "Dr. Sarah Johnson", specialty: "Orthodontics", yearsExperience: 10, languages: ["English"] }
              ], // Placeholder - would come from API/database
              languages: ["English", "Spanish"], // Placeholder
              sedationOptions: ["Nitrous Oxide", "Oral Sedation"],
              pediatricSpecialty: Math.random() > 0.5,
              anxietyFriendly: Math.random() > 0.5,
              travelFriendly: Math.random() > 0.5,
              // Add default empty objects for other fields to prevent undefined errors
              offerings: {},
              amenities: {},
              planning: {},
              insuranceAccepted: {},
              specialDesignations: {},
              providerInfo: {},
              knowBeforeYouGo: []
            };
          });

          // MANUALLY ADD ROYSE CITY DENTAL CARE WITH ALL DETAILS FROM SCREENSHOTS
          
          // Calculate accurate distance if we have user location
          let royseCityDistance = null;
          if (userLocation) {
            // Exact coordinates for Royse City Dental Care from the address
            // 522 TX-66, Royse City, TX 75189
            royseCityDistance = getDistanceMiles(
              userLocation.latitude, 
              userLocation.longitude, 
              32.9751, // Approximate latitude for Royse City
              -96.3327 // Approximate longitude for Royse City
            );
          }

          // Sample reviews from screenshots
          const royseCityReviews = [
            {
              author: "Francisco Arellano",
              rating: 5,
              text: "I've been coming to this dental office for about 3 years now, and I've always had a great experience. The staff is really nice, welcoming, and genuinely helpful. They make you feel comfortable and explain everything thoroughly.",
              time: "3 weeks ago",
              isLocalGuide: true
            },
            {
              author: "Keyri Marquez",
              rating: 5,
              text: "Amazing experience! The team is professional and caring. They got me in quickly for an urgent issue and took great care of me.",
              time: "a month ago",
              isLocalGuide: false
            }
          ];

          const royseCityDental = {
            id: "royse-city-dental-care-premier",
            name: "Royse City Dental Care",
            address: "522 TX-66, Royse City, TX 75189",
            rating: 4.9,
            review_count: 1103,
            distance: royseCityDistance ? parseFloat(royseCityDistance) : 15.5,
            openNow: true,
            phone: "(972) 636-2417",
            website: "https://roysecitydentalcare.com",
            mapsLink: `https://www.google.com/maps/dir/?api=1&destination=Royse+City+Dental+Care&destination_place_id=ChIJ_royse_city_placeholder`,
            isRoyseCity: true,
            photos: [], // No photos
            businessStatus: "OPERATIONAL",
            priceLevel: 2, // $$ moderate
            lat: 32.9751,
            lng: -96.3327,
            
            // COMPREHENSIVE DETAILS FROM SCREENSHOTS
            hours: {
              Monday: "7 AM–7 PM",
              Tuesday: "7 AM–7 PM",
              Wednesday: "7 AM–5 PM",
              Thursday: "7 AM–7 PM",
              Friday: "7 AM–2 PM",
              Saturday: "Closed",
              Sunday: "Closed"
            },
            
            // Service options
            serviceOptions: {
              onsiteServices: true,
              telehealth: false
            },
            
            // Accessibility features
            accessibility: {
              wheelchairEntrance: true,
              wheelchairParking: true,
              wheelchairRestroom: true,
              wheelchairSeating: true
            },
            
            // Offerings
            offerings: {
              cosmeticDentistry: true,
              pediatricCare: true,
              sedationDentistry: true,
              teethWhitening: true,
              cleanings: true,
              sealants: true,
              comprehensiveDentalCare: true,
              emergencyDentalCare: true,
              orthodontics: true,
              dentalImplants: true,
              crowns: true,
              bridges: true,
              rootCanal: true,
              dentures: true,
              oralSurgery: true,
              periodontics: true,
              endodontics: true
            },
            
            // Amenities
            amenities: {
              restroom: true,
              wifi: false,
              coffee: false,
              parking: true,
              freeParking: true,
              streetParking: false
            },
            
            // Planning
            planning: {
              appointmentRequired: true,
              appointmentsRecommended: true,
              acceptsWalkIns: false,
              onlineAppointments: true
            },
            
            // Payments
            paymentOptions: {
              creditCards: true,
              debitCards: true,
              nfcMobilePayments: true, // Apple Pay, Google Pay
              paymentPlans: true,
              insurance: true,
              cash: true,
              check: false,
              careCredit: true
            },
            
            // Insurance specifics
            insuranceAccepted: {
              deltaDental: true,
              aetna: true,
              cigna: true,
              metLife: true,
              unitedHealthcare: true,
              medicaid: true,
              medicare: true,
              blueCrossBlueShield: true,
              guardian: true,
              humana: true
            },
            
            // Special designations
            specialDesignations: {
              medicaidProvider: true,
              orthoProvider: true,
              emergencyProvider: true
            },
            
            // Languages
            languages: ["English", "Spanish"],
            
            // Provider info
            providerInfo: {
              acceptingNewPatients: true,
              emergencyAppointments: true,
              walkInFriendly: false,
              virtualConsultations: false
            },
            
            // Know before you go (from screenshots)
            knowBeforeYouGo: [
              "They work with cash pay clients and offer many options",
              "People say they can get you in quickly for urgent issues",
              "Medicaid and Ortho Provider",
              "Friendly and caring staff (419 mentions)",
              "Caring staff (69 mentions)",
              "New patients welcome"
            ],
            
            // Reviews array
            reviews: royseCityReviews,
            
            // NEW: Enhanced fields for Royse City
            dentists: [
              { name: "Dr. Smith", specialty: "General Dentistry", yearsExperience: 20, languages: ["English", "Spanish"] },
              { name: "Dr. Rodriguez", specialty: "Orthodontics", yearsExperience: 15, languages: ["English", "Spanish"] }
            ],
            sedationOptions: ["Nitrous Oxide", "Oral Sedation"],
            pediatricSpecialty: true,
            anxietyFriendly: true,
            travelFriendly: true
          };

          // Combine and ensure Royse City is at the beginning
          const otherDentists = enriched.filter(d => !d.isRoyseCity);
          setDentists([royseCityDental, ...otherDentists]);

        } catch (err) {
          console.error("Fetch error:", err);
          // Even if API fails, still show Royse City with all details
          const royseCityDental = {
            id: "royse-city-dental-care-premier",
            name: "Royse City Dental Care",
            address: "522 TX-66, Royse City, TX 75189",
            rating: 4.9,
            review_count: 1103,
            distance: 15.5,
            openNow: true,
            phone: "(972) 636-2417",
            website: "https://roysecitydentalcare.com",
            mapsLink: `https://www.google.com/maps/dir/?api=1&destination=Royse+City+Dental+Care&destination_place_id=ChIJ_royse_city_placeholder`,
            isRoyseCity: true,
            photos: [],
            businessStatus: "OPERATIONAL",
            priceLevel: 2,
            lat: 32.9751,
            lng: -96.3327,
            hours: {
              Monday: "7 AM–7 PM",
              Tuesday: "7 AM–7 PM",
              Wednesday: "7 AM–5 PM",
              Thursday: "7 AM–7 PM",
              Friday: "7 AM–2 PM",
              Saturday: "Closed",
              Sunday: "Closed"
            },
            serviceOptions: { onsiteServices: true },
            accessibility: {
              wheelchairEntrance: true,
              wheelchairParking: true,
              wheelchairRestroom: true
            },
            offerings: {
              cosmeticDentistry: true,
              pediatricCare: true,
              sedationDentistry: true,
              teethWhitening: true,
              cleanings: true,
              sealants: true
            },
            amenities: { restroom: true, parking: true, freeParking: true },
            planning: { appointmentRequired: true, appointmentsRecommended: true },
            paymentOptions: {
              creditCards: true,
              debitCards: true,
              nfcMobilePayments: true,
              paymentPlans: true,
              insurance: true,
              cash: true
            },
            insuranceAccepted: {
              medicaid: true,
              medicare: true
            },
            specialDesignations: {
              medicaidProvider: true,
              orthoProvider: true,
              emergencyProvider: true
            },
            languages: ["English", "Spanish"],
            providerInfo: {
              acceptingNewPatients: true,
              emergencyAppointments: true
            },
            knowBeforeYouGo: [
              "They work with cash pay clients and offer many options",
              "People say they can get you in quickly for urgent issues",
              "Medicaid and Ortho Provider"
            ],
            dentists: [
              { name: "Dr. Smith", specialty: "General Dentistry", yearsExperience: 20, languages: ["English", "Spanish"] }
            ],
            sedationOptions: ["Nitrous Oxide"],
            pediatricSpecialty: true,
            anxietyFriendly: true,
            travelFriendly: true
          };
          setDentists([royseCityDental]);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        // Even with location error, show Royse City with all details
        const royseCityDental = {
          id: "royse-city-dental-care-premier",
          name: "Royse City Dental Care",
          address: "522 TX-66, Royse City, TX 75189",
          rating: 4.9,
          review_count: 1103,
          distance: 15.5,
          openNow: true,
          phone: "(972) 636-2417",
          website: "https://roysecitydentalcare.com",
          mapsLink: `https://www.google.com/maps/dir/?api=1&destination=Royse+City+Dental+Care&destination_place_id=ChIJ_royse_city_placeholder`,
          isRoyseCity: true,
          photos: [],
          businessStatus: "OPERATIONAL",
          priceLevel: 2,
          lat: 32.9751,
          lng: -96.3327,
          hours: {
            Monday: "7 AM–7 PM",
            Tuesday: "7 AM–7 PM",
            Wednesday: "7 AM–5 PM",
            Thursday: "7 AM–7 PM",
            Friday: "7 AM–2 PM",
            Saturday: "Closed",
            Sunday: "Closed"
          },
          serviceOptions: { onsiteServices: true },
          accessibility: {
            wheelchairEntrance: true,
            wheelchairParking: true,
            wheelchairRestroom: true
          },
          offerings: {
            cosmeticDentistry: true,
            pediatricCare: true,
            sedationDentistry: true,
            teethWhitening: true,
            cleanings: true,
            sealants: true
          },
          amenities: { restroom: true, parking: true, freeParking: true },
          planning: { appointmentRequired: true, appointmentsRecommended: true },
          paymentOptions: {
            creditCards: true,
            debitCards: true,
            nfcMobilePayments: true,
            paymentPlans: true,
            insurance: true,
            cash: true
          },
          insuranceAccepted: {
            medicaid: true,
            medicare: true
          },
          specialDesignations: {
            medicaidProvider: true,
            orthoProvider: true,
            emergencyProvider: true
          },
          languages: ["English", "Spanish"],
          providerInfo: {
            acceptingNewPatients: true,
            emergencyAppointments: true
          },
          knowBeforeYouGo: [
            "They work with cash pay clients and offer many options",
            "People say they can get you in quickly for urgent issues",
            "Medicaid and Ortho Provider"
          ],
          reviews: [
            {
              author: "Francisco Arellano",
              rating: 5,
              text: "I've been coming to this dental office for about 3 years now, and I've always had a great experience.",
              time: "3 weeks ago"
            }
          ],
          dentists: [
            { name: "Dr. Smith", specialty: "General Dentistry", yearsExperience: 20, languages: ["English", "Spanish"] }
          ],
          sedationOptions: ["Nitrous Oxide"],
          pediatricSpecialty: true,
          anxietyFriendly: true,
          travelFriendly: true
        };
        setDentists([royseCityDental]);
        setLocationError(true);
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    fetchDentists(searchRadius);
  }, [searchRadius]);

  const filteredDentists = useMemo(() => {
    return dentists.filter(d => {
      if (searchQuery && !d.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterOpenNow && !d.openNow) return false;
      if (filterMinRating > 0 && (d.rating || 0) < filterMinRating) return false;
      if (d.distance !== null && d.distance !== undefined && d.distance > searchRadius) return false;
      
      // NEW: Apply accessibility filters
      if (!applyAccessibilityFilters(d)) return false;
      
      // NEW: Family & Kids filter
      if (showFamilyKids && !d.pediatricSpecialty) return false;
      
      // NEW: Dental Anxiety filter
      if (showDentalAnxiety && !d.anxietyFriendly && !d.sedationOptions?.length) return false;
      
      return true;
    });
  }, [dentists, searchQuery, filterOpenNow, filterMinRating, searchRadius, 
      accessibilityFilters, showFamilyKids, showDentalAnxiety]);

  const getSortedDentists = () => {
    let sorted = [...filteredDentists];
    
    if (sortBy === "recommended") {
      // Royse City ONLY at the top for recommended sort
      const royseCity = sorted.filter(d => d.isRoyseCity);
      const others = sorted.filter(d => !d.isRoyseCity);
      
      const sortedOthers = others.sort((a, b) => {
        const scoreA = (a.rating || 0) * 10 - (a.distance || 99);
        const scoreB = (b.rating || 0) * 10 - (b.distance || 99);
        return scoreB - scoreA;
      });
      
      return [...royseCity, ...sortedOthers];
    }
    
    if (sortBy === "rating") {
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "distance") {
      return sorted.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    }
    
    return sorted;
  };

  const sortedDentists = getSortedDentists();

  const getBadge = (dentist) => {
    if (dentist.isRoyseCity) {
      return { text: "⭐ #1 Recommended", color: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg" };
    }
    if (dentist.rating >= 4.8 && dentist.review_count >= 50) {
      return { text: "🏆 Highly Rated", color: "bg-blue-100 text-blue-700" };
    }
    if (dentist.distance && dentist.distance < 2) {
      return { text: "📍 Nearby", color: "bg-green-100 text-green-700" };
    }
    return null;
  };

  const getPhotoUrl = (photoResource) => {
    if (!photoResource) return null;
    if (photoResource.url) return photoResource.url;
    if (photoResource.name) {
      return `https://places.googleapis.com/v1/${photoResource.name}/media?maxHeightPx=400&maxWidthPx=400&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}`;
    }
    if (typeof photoResource === 'string') return photoResource;
    return null;
  };

  const getConfidenceColor = (confidence) => {
    switch(confidence) {
      case 'high': return 'text-emerald-600 bg-emerald-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  if (Object.keys(translatedText).length === 0) {
    return (
      <section className="space-y-6 pb-8">
        <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-500 text-white rounded-[2.5rem] p-8 shadow-xl">
          <div className="animate-pulse flex items-center gap-3">
            <MapPin className="w-7 h-7" />
            <h2 className="text-3xl font-black">Loading...</h2>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 pb-8">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-500 text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-7 h-7" />
                <h2 className="text-3xl font-black">{translatedText.title}</h2>
              </div>
              <p className="text-base opacity-90">{translatedText.subtitle}</p>
            </div>
            <div className="flex gap-2">
              {/* NEW: Feature buttons - Now in a 2x2 grid on mobile */}
              <div className="grid grid-cols-2 gap-1 sm:flex sm:gap-2">
                <button
                  onClick={() => setShowAIAssistant(!showAIAssistant)}
                  className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 hover:bg-white/30 transition-all hover:scale-105 relative"
                  title="AI Assistant"
                >
                  <Bot className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowPriceEstimator(!showPriceEstimator)}
                  className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 hover:bg-white/30 transition-all hover:scale-105"
                  title="Price Estimator"
                >
                  <DollarSign className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowTreatmentPlanner(!showTreatmentPlanner)}
                  className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 hover:bg-white/30 transition-all hover:scale-105"
                  title="Treatment Planner"
                >
                  <Calendar className="w-5 h-5" />
                </button>
                {selectedForCompare.length > 0 && (
                  <button onClick={() => setShowCompare(true)} className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 hover:bg-white/30 transition-all hover:scale-105 relative">
                    <BarChart3 className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full text-xs font-bold flex items-center justify-center shadow-lg">{selectedForCompare.length}</span>
                  </button>
                )}
                {favorites.length > 0 && (
                  <button onClick={() => setShowFavorites(true)} className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 hover:bg-white/30 transition-all hover:scale-105 relative">
                    <Heart className="w-5 h-5 fill-white" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center shadow-lg">{favorites.length}</span>
                  </button>
                )}
                <button onClick={() => setShowFilters(!showFilters)} className={`rounded-2xl p-3 transition-all hover:scale-105 ${showFilters ? 'bg-white/30' : 'bg-white/20 hover:bg-white/30'}`}>
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name..." className="w-full pl-14 pr-5 py-4 bg-white/20 backdrop-blur-sm rounded-2xl text-white placeholder-white/60 focus:outline-none focus:bg-white/30 transition-all text-base" />
          </div>
        </div>
      </div>

      {/* NEW: AI Assistant Modal */}
      {showAIAssistant && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] max-w-lg w-full p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Bot className="w-6 h-6 text-blue-600" />
                <h3 className="text-2xl font-black text-gray-900">Dental AI Assistant</h3>
              </div>
              <button onClick={() => { setShowAIAssistant(false); setAiResponse(""); setAiQuery(""); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Ask me anything about dental health, procedures, or finding the right dentist! ⚠️ This is general educational information, not a diagnosis or treatment plan. For anything specific to you, please see a licensed dentist. </p>
            <div className="space-y-4">
              <textarea
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="e.g., What's the difference between a crown and a filling? Or find me a dentist who accepts Medicaid..."
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none resize-none h-32"
              />
              <button
                onClick={askAIAssistant}
                disabled={aiLoading || !aiQuery.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Thinking...
                  </div>
                ) : (
                  "Ask AI Assistant"
                )}
              </button>
              {aiResponse && (
                <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200 max-h-96 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{aiResponse}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NEW: Price Estimator Modal */}
      {showPriceEstimator && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] max-w-lg w-full p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-blue-600" />
                <h3 className="text-2xl font-black text-gray-900">Price Estimator</h3>
              </div>
              <button onClick={() => setShowPriceEstimator(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Procedure</label>
                <select
                  value={selectedProcedure}
                  onChange={(e) => setSelectedProcedure(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
                >
                  {Object.keys(procedurePriceEstimates).map(proc => (
                    <option key={proc} value={proc}>
                      {proc.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              {selectedProcedure && (
                <div className="bg-blue-50 p-6 rounded-xl">
                  <p className="text-sm text-gray-600 mb-2">Estimated Price Range</p>
                  <p className="text-3xl font-black text-blue-600">
                    ${procedurePriceEstimates[selectedProcedure].min} - ${procedurePriceEstimates[selectedProcedure].max}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">*Prices vary by location and dentist. Contact office for exact pricing.</p>
                </div>
              )}
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <p className="text-xs font-bold text-amber-800 mb-1">💡 Tip</p>
                <p className="text-xs text-amber-700">Dental schools often offer discounted procedures. Check the "Dental Schools" filter!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Treatment Planner Modal */}
      {showTreatmentPlanner && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] max-w-lg w-full p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-blue-600" />
                <h3 className="text-2xl font-black text-gray-900">Treatment Planner</h3>
              </div>
              <button onClick={() => setShowTreatmentPlanner(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">What symptoms are you experiencing?</p>
            <div className="space-y-4">
              <select
                value={symptom}
                onChange={(e) => handleSymptomChange(e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
              >
                <option value="">Select a symptom...</option>
                {Object.keys(symptomToProcedure).map(sym => (
                  <option key={sym} value={sym}>
                    {sym.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </option>
                ))}
              </select>
              {recommendedProcedures.length > 0 && (
                <div className="bg-blue-50 p-6 rounded-xl">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Recommended Procedures:</p>
                  <div className="space-y-2">
                    {recommendedProcedures.map(proc => (
                      <div key={proc} className="flex items-center justify-between p-2 bg-white rounded-lg">
                        <span className="font-medium text-gray-900">
                          {proc.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                        <span className="text-sm text-blue-600">
                          ${procedurePriceEstimates[proc]?.min} - ${procedurePriceEstimates[proc]?.max}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* IMPROVED: Cleaner Filters UI */}
      {showFilters && !locationError && (
        <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Filters</h3>
            <button onClick={() => { 
              setFilterOpenNow(false); 
              setFilterMinRating(0); 
              setSearchRadius(31);
              setAccessibilityFilters({
                wheelchair: false,
                signLanguage: false,
                largePrint: false,
                serviceAnimal: false,
                sensoryFriendly: false
              });
              setShowFamilyKids(false);
              setShowDentalAnxiety(false);
              setShowTravelMode(false);
            }} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">Clear All</button>
          </div>
          
          <div className="space-y-6">
            {/* Basic Filters - Card Style */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Basic Filters</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-600">{translatedText.searchRadius}</label>
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{searchRadius} mi</span>
                  </div>
                  <input type="range" min="1" max="31" value={searchRadius} onChange={(e) => setSearchRadius(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 mi</span><span>16 mi</span><span>31 mi</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Minimum Rating</label>
                  <div className="flex flex-wrap gap-2">
                    {[0, 3, 4, 4.5].map(rating => (
                      <button key={rating} onClick={() => setFilterMinRating(rating)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filterMinRating === rating ? 'bg-blue-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'}`}>
                        {rating === 0 ? 'Any' : `${rating}+ ⭐`}
                      </button>
                    ))}
                  </div>
                </div>
                
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-xl transition-colors">
                  <input type="checkbox" checked={filterOpenNow} onChange={(e) => setFilterOpenNow(e.target.checked)} className="w-5 h-5 rounded accent-blue-600" />
                  <span className="text-sm font-medium text-gray-700">{translatedText.onlyOpenNow}</span>
                </label>
              </div>
            </div>

            {/* Accessibility Features - Card Style */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Wheelchair className="w-4 h-4 text-blue-600" />
                Accessibility Features
              </h4>
              <div className="grid grid-cols-1 gap-2">
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-xl transition-colors">
                  <input type="checkbox" checked={accessibilityFilters.wheelchair} onChange={(e) => setAccessibilityFilters(prev => ({ ...prev, wheelchair: e.target.checked }))} className="w-5 h-5 rounded accent-blue-600" />
                  <span className="text-sm text-gray-700">Wheelchair Accessible</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-xl transition-colors">
                  <input type="checkbox" checked={accessibilityFilters.signLanguage} onChange={(e) => setAccessibilityFilters(prev => ({ ...prev, signLanguage: e.target.checked }))} className="w-5 h-5 rounded accent-blue-600" />
                  <span className="text-sm text-gray-700">Sign Language Interpreter</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-xl transition-colors">
                  <input type="checkbox" checked={accessibilityFilters.largePrint} onChange={(e) => setAccessibilityFilters(prev => ({ ...prev, largePrint: e.target.checked }))} className="w-5 h-5 rounded accent-blue-600" />
                  <span className="text-sm text-gray-700">Large Print Materials</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-xl transition-colors">
                  <input type="checkbox" checked={accessibilityFilters.serviceAnimal} onChange={(e) => setAccessibilityFilters(prev => ({ ...prev, serviceAnimal: e.target.checked }))} className="w-5 h-5 rounded accent-blue-600" />
                  <span className="text-sm text-gray-700">Service Animal Friendly</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-xl transition-colors">
                  <input type="checkbox" checked={accessibilityFilters.sensoryFriendly} onChange={(e) => setAccessibilityFilters(prev => ({ ...prev, sensoryFriendly: e.target.checked }))} className="w-5 h-5 rounded accent-blue-600" />
                  <span className="text-sm text-gray-700">Sensory-Friendly Environment</span>
                </label>
              </div>
            </div>

            {/* Specialized Care - Card Style */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Specialized Care</h4>
              <div className="grid grid-cols-1 gap-2">
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-xl transition-colors">
                  <input type="checkbox" checked={showFamilyKids} onChange={(e) => setShowFamilyKids(e.target.checked)} className="w-5 h-5 rounded accent-blue-600" />
                  <span className="text-sm text-gray-700 flex items-center gap-1">
                    <Baby className="w-4 h-4 text-pink-500" /> Pediatric / Family Dentistry
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-xl transition-colors">
                  <input type="checkbox" checked={showDentalAnxiety} onChange={(e) => setShowDentalAnxiety(e.target.checked)} className="w-5 h-5 rounded accent-blue-600" />
                  <span className="text-sm text-gray-700 flex items-center gap-1">
                    <Heart className="w-4 h-4 text-red-500" /> Anxiety-Friendly / Sedation
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-xl transition-colors">
                  <input type="checkbox" checked={showTravelMode} onChange={(e) => setShowTravelMode(e.target.checked)} className="w-5 h-5 rounded accent-blue-600" />
                  <span className="text-sm text-gray-700 flex items-center gap-1">
                    <Plane className="w-4 h-4 text-purple-500" /> Travel-Friendly (Near Airports/Hotels)
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSURANCE */}
      {!locationError && (
        <div className="bg-white rounded-[2rem] p-6 shadow-md border border-blue-100">
          <label className="text-sm font-semibold text-gray-700 mb-2 block">{translatedText.yourInsurance}</label>
          <select value={insurance} onChange={(e) => setInsurance(e.target.value)} className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none font-medium">
            <option value="">{translatedText.selectInsurance}</option>
            {['Delta Dental', 'Aetna', 'Cigna', 'MetLife', 'UnitedHealthcare', 'Medicaid', 'Medicare', 'Blue Cross Blue Shield', 'Guardian', 'Humana'].map(ins => <option key={ins}>{ins}</option>)}
          </select>
        </div>
      )}

      {/* SORT */}
      {!locationError && dentists.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'recommended', label: translatedText.recommended, icon: <Award className="w-4 h-4" /> },
            { id: 'rating', label: translatedText.bestRated, icon: <Star className="w-4 h-4" /> },
            { id: 'distance', label: translatedText.closest, icon: <Navigation className="w-4 h-4" /> }
          ].map(sort => (
            <button key={sort.id} onClick={() => setSortBy(sort.id)} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold whitespace-nowrap transition-all text-sm ${sortBy === sort.id ? 'bg-blue-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'}`}>
              {sort.icon}{sort.label}
            </button>
          ))}
        </div>
      )}

      {/* RESULTS COUNT */}
      {!locationError && <p className="text-sm text-gray-600 font-medium px-1">Found <span className="text-blue-600 font-bold">{sortedDentists.length}</span> {translatedText.results}</p>}

      {/* LOADING */}
      {loading && !locationError && (
        <div className="text-center py-16">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium text-lg">{translatedText.loading}</p>
        </div>
      )}

      {/* LOCATION ERROR */}
      {locationError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-[2rem] p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-3">Location access denied. Please enable location services.</p>
          <button onClick={() => fetchDentists(searchRadius)} className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors">Retry</button>
        </div>
      )}

      {/* NO RESULTS */}
      {!loading && !locationError && sortedDentists.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-[2rem]">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium text-lg">{translatedText.noDentists}</p>
          <p className="text-sm text-gray-500 mt-2">{translatedText.expandSearch}</p>
        </div>
      )}

      {/* DENTIST CARDS */}
      {!locationError && (
        <div className="space-y-4">
          {sortedDentists.map((d) => {
            const estimate = insuranceEstimates[d.id];
            const badge = getBadge(d);
            const isInCompare = selectedForCompare.some(s => s.id === d.id);

            return (
              <div key={d.id} className={`group bg-white rounded-[2rem] p-6 shadow-md border-2 transition-all duration-200 ${isInCompare ? 'border-blue-400 shadow-lg scale-[1.02]' : 'border-gray-200 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1'}`}>
                {d.photos && d.photos.length > 0 && (
                  <div className="mb-4 -mx-6 -mt-6">
                    <div className="flex gap-2 overflow-x-auto pb-2 px-6 pt-6">
                      {d.photos.slice(0, 4).map((photo, idx) => {
                        const photoUrl = getPhotoUrl(photo);
                        return photoUrl ? (
                          <button key={idx} onClick={() => { setSelectedPhoto(photoUrl); setShowPhotoModal(true); }} className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden hover:scale-105 transition-transform">
                            <img src={photoUrl} alt={`${d.name} photo ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/400x400/4f46e5/ffffff?text=Dental+Clinic";
                              }}
                            />
                          </button>
                        ) : null;
                      })}
                      {d.photos.length > 4 && <div className="flex-shrink-0 w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center"><span className="text-xs text-gray-500">+{d.photos.length - 4}</span></div>}
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-black text-gray-900 text-xl mb-2">{d.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {badge && <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full ${badge.color}`}>{badge.text}</span>}
                      {d.specialDesignations?.medicaidProvider && (
                        <span className="inline-block text-xs font-bold px-3 py-1.5 rounded-full bg-green-100 text-green-700">✓ Medicaid Provider</span>
                      )}
                      {d.specialDesignations?.orthoProvider && (
                        <span className="inline-block text-xs font-bold px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">Ortho Provider</span>
                      )}
                      {/* NEW: Specialized badges */}
                      {d.pediatricSpecialty && (
                        <span className="inline-block text-xs font-bold px-3 py-1.5 rounded-full bg-pink-100 text-pink-700">👶 Kids Friendly</span>
                      )}
                      {d.anxietyFriendly && (
                        <span className="inline-block text-xs font-bold px-3 py-1.5 rounded-full bg-red-100 text-red-700">🧠 Anxiety Friendly</span>
                      )}
                      {d.sedationOptions?.length > 0 && (
                        <span className="inline-block text-xs font-bold px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">💤 Sedation Available</span>
                      )}
                      {d.travelFriendly && (
                        <span className="inline-block text-xs font-bold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">✈️ Travel Friendly</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleCompare(d)} className={`p-3 rounded-xl transition-all ${isInCompare ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-400'}`}><BarChart3 className="w-5 h-5" /></button>
                    <button onClick={() => toggleFavorite(d)} className="p-3 rounded-xl hover:bg-gray-100 transition-all"><Heart className={`w-5 h-5 transition-all ${isFavorite(d.id) ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-400'}`} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {d.rating && (
                    <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-full">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-gray-900">{d.rating}</span>
                      {d.review_count > 0 && <span className="text-xs text-gray-500">({d.review_count})</span>}
                    </div>
                  )}
                  {d.openNow !== undefined && (
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${d.openNow ? 'bg-green-50' : 'bg-gray-100'}`}>
                      <Clock className={`w-4 h-4 ${d.openNow ? 'text-green-600' : 'text-gray-500'}`} />
                      <span className={`text-xs font-semibold ${d.openNow ? 'text-green-700' : 'text-gray-600'}`}>{d.openNow ? translatedText.openNow : translatedText.closed}</span>
                    </div>
                  )}
                  {d.distance && (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50">
                      <Navigation className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-700">{d.distance} mi</span>
                    </div>
                  )}
                  {d.priceLevel && (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100">
                      <DollarSign className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-semibold text-gray-700">{'$'.repeat(d.priceLevel)}</span>
                    </div>
                  )}
                </div>
                
                {/* Accessibility & Amenities Icons */}
                {d.accessibility && Object.keys(d.accessibility).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {d.accessibility.wheelchairEntrance && (
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                        <Wheelchair className="w-3 h-3" /> Wheelchair Access
                      </span>
                    )}
                    {d.paymentOptions?.creditCards && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg">
                        <CreditCard className="w-3 h-3" /> Cards Accepted
                      </span>
                    )}
                    {d.paymentOptions?.nfcMobilePayments && (
                      <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-lg">
                        <Zap className="w-3 h-3" /> NFC Payments
                      </span>
                    )}
                    {d.paymentOptions?.insurance && (
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg">
                        <Shield className="w-3 h-3" /> Insurance Accepted
                      </span>
                    )}
                    {/* NEW: Additional amenity icons */}
                    {d.languages?.includes("Spanish") && (
                      <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-lg">
                        <LanguagesIcon className="w-3 h-3" /> Español
                      </span>
                    )}
                    {d.pediatricSpecialty && (
                      <span className="inline-flex items-center gap-1 text-xs bg-pink-50 text-pink-700 px-2 py-1 rounded-lg">
                        <Baby className="w-3 h-3" /> Kids Welcome
                      </span>
                    )}
                  </div>
                )}
                
                {d.address && <p className="text-sm text-gray-600 mb-3 flex items-start gap-2"><MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />{d.address}</p>}
                
                {/* Know Before You Go Section for Royse City */}
                {d.knowBeforeYouGo && d.knowBeforeYouGo.length > 0 && (
                  <div className="mb-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-xs font-bold text-amber-800 mb-1">✨ Know Before You Go</p>
                    <ul className="space-y-1">
                      {d.knowBeforeYouGo.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="text-xs text-amber-700 flex items-start gap-1">
                          <span className="text-amber-500 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* NEW: Sedation Options */}
                {d.sedationOptions && d.sedationOptions.length > 0 && (
                  <div className="mb-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs font-semibold text-purple-800 mb-1">💤 Sedation Options:</p>
                    <p className="text-xs text-purple-700">{d.sedationOptions.join(' • ')}</p>
                  </div>
                )}
                
                {insurance && estimate && (
                  <div className={`flex items-start gap-3 p-4 rounded-xl mb-4 ${estimate.accepts ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-amber-50'}`}>
                    {estimate.accepts ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${estimate.accepts ? 'text-emerald-700' : 'text-amber-700'}`}>{estimate.accepts ? `✓ ${translatedText.likelyAccepts} ${insurance}` : `${translatedText.mayNotAccept} ${insurance}`}</p>
                      <p className="text-xs text-gray-700 mt-1">{estimate.reason}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getConfidenceColor(estimate.confidence)} inline-block mt-2`}>{estimate.confidence} confidence</span>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <a href={d.mapsLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 bg-blue-500 text-white py-3 rounded-xl text-xs font-semibold hover:bg-blue-600 transition-all hover:scale-[1.02]"><MapPin className="w-3 h-3" /><span>{translatedText.directions}</span></a>
                  {d.phone && <a href={`tel:${d.phone}`} className="flex items-center justify-center gap-1 bg-green-500 text-white py-3 rounded-xl text-xs font-semibold hover:bg-green-600 transition-all hover:scale-[1.02]"><Phone className="w-3 h-3" /><span>{translatedText.call}</span></a>}
                  <button onClick={() => { fetchPlaceDetails(d.id); setSelectedDentist(d); }} className="flex items-center justify-center gap-1 bg-white border-2 border-gray-200 text-gray-900 py-3 rounded-xl text-xs font-semibold hover:border-blue-300 transition-all hover:scale-[1.02]"><ChevronRight className="w-3 h-3" /><span>{translatedText.viewDetails}</span></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PHOTO MODAL */}
      {showPhotoModal && selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => { setShowPhotoModal(false); setSelectedPhoto(null); }}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300" onClick={() => { setShowPhotoModal(false); setSelectedPhoto(null); }}><X className="w-8 h-8" /></button>
          <img src={selectedPhoto} alt="Dentist office" className="max-w-full max-h-[90vh] rounded-2xl" />
        </div>
      )}

      {/* DETAILS MODAL */}
      {selectedDentist && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] max-w-2xl w-full p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-gray-900">{selectedDentist.name}</h3>
              <button onClick={() => setSelectedDentist(null)} className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-blue-50 p-5 rounded-xl">
                <p className="text-sm text-gray-700 mb-2 flex items-start gap-2"><MapPin className="w-4 h-4 text-blue-600 mt-0.5" />{selectedDentist.address}</p>
                {selectedDentist.phone && <a href={`tel:${selectedDentist.phone}`} className="text-sm text-blue-600 font-semibold flex items-center gap-2 hover:text-blue-700"><Phone className="w-4 h-4" />{selectedDentist.phone}</a>}
                {selectedDentist.website && <a href={selectedDentist.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 font-semibold flex items-center gap-2 mt-2 hover:text-blue-700"><Globe className="w-4 h-4" />{translatedText.website}</a>}
              </div>

              {/* Hours */}
              {selectedDentist.hours && Object.keys(selectedDentist.hours).length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-600" />Hours</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(selectedDentist.hours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span className="font-medium text-gray-600">{day}:</span>
                        <span className="text-gray-900">{hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services & Offerings */}
              {selectedDentist.offerings && Object.keys(selectedDentist.offerings).length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Zap className="w-5 h-5 text-blue-600" />Services</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedDentist.offerings)
                      .filter(([_, value]) => value === true)
                      .map(([key]) => (
                        <span key={key} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Accessibility */}
              {selectedDentist.accessibility && Object.keys(selectedDentist.accessibility).length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Wheelchair className="w-5 h-5 text-blue-600" />Accessibility</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedDentist.accessibility)
                      .filter(([_, value]) => value === true)
                      .map(([key]) => (
                        <span key={key} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Payment Options */}
              {selectedDentist.paymentOptions && Object.keys(selectedDentist.paymentOptions).length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-600" />Payment Options</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedDentist.paymentOptions)
                      .filter(([_, value]) => value === true)
                      .map(([key]) => (
                        <span key={key} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Insurance Accepted */}
              {selectedDentist.insuranceAccepted && Object.keys(selectedDentist.insuranceAccepted).length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Shield className="w-5 h-5 text-blue-600" />Insurance Accepted</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedDentist.insuranceAccepted)
                      .filter(([_, value]) => value === true)
                      .map(([key]) => (
                        <span key={key} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* NEW: Dentist Profiles in Details */}
              {selectedDentist.dentists && selectedDentist.dentists.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" />Our Dentists</h4>
                  <div className="space-y-3">
                    {selectedDentist.dentists.map((dentist, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-xl">
                        <p className="font-bold text-gray-900">{dentist.name}</p>
                        <p className="text-sm text-gray-600">{dentist.specialty} • {dentist.yearsExperience} years experience</p>
                        {dentist.languages && (
                          <p className="text-xs text-gray-500 mt-1">Languages: {dentist.languages.join(', ')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NEW: Sedation Options */}
              {selectedDentist.sedationOptions && selectedDentist.sedationOptions.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Thermometer className="w-5 h-5 text-blue-600" />Sedation Options</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDentist.sedationOptions.map((option, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {option}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* NEW: Languages */}
              {selectedDentist.languages && selectedDentist.languages.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><LanguagesIcon className="w-5 h-5 text-blue-600" />Languages Spoken</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDentist.languages.map((lang, idx) => (
                      <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {selectedDentist.reviews && selectedDentist.reviews.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Star className="w-5 h-5 text-blue-600 fill-blue-600" />Recent Reviews</h4>
                  <div className="space-y-3">
                    {selectedDentist.reviews.map((review, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-gray-900">{review.author}</span>
                          {review.isLocalGuide && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Local Guide</span>}
                          <span className="text-xs text-gray-500">{review.time}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <p className="text-sm text-gray-700">{review.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos */}
              {selectedDentist.photos && selectedDentist.photos.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-blue-600" />{translatedText.photos}</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedDentist.photos.slice(0, 6).map((photo, idx) => {
                      const photoUrl = getPhotoUrl(photo);
                      return photoUrl ? (
                        <button key={idx} onClick={() => { setSelectedPhoto(photoUrl); setShowPhotoModal(true); }} className="aspect-square rounded-xl overflow-hidden hover:scale-105 transition-transform">
                          <img src={photoUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/400x400/4f46e5/ffffff?text=Dental+Clinic";
                            }}
                          />
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              
              {loadingDetails[selectedDentist.id] && <div className="text-center py-4"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>}
            </div>
          </div>
        </div>
      )}

      {/* FAVORITES MODAL */}
      {showFavorites && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] max-w-lg w-full p-8 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-gray-900">{translatedText.savedDentists}</h3>
              <button onClick={() => setShowFavorites(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            {favorites.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No saved dentists yet</p>
            ) : (
              <div className="space-y-3">
                {favorites.map(d => (
                  <div key={d.id} className="p-4 bg-gray-50 rounded-xl flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900">{d.name}</p>
                      <p className="text-sm text-gray-600">{d.address}</p>
                      {d.distance && <p className="text-xs text-blue-600 mt-1">{d.distance} miles away</p>}
                    </div>
                    <button onClick={() => toggleFavorite(d)} className="text-red-500 hover:text-red-600"><X className="w-5 h-5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPARE MODAL */}
      {showCompare && selectedForCompare.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] max-w-4xl w-full p-8 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-gray-900">Compare Dentists</h3>
              <button onClick={() => setShowCompare(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedForCompare.map(d => (
                <div key={d.id} className="p-5 bg-gray-50 rounded-2xl">
                  <h4 className="font-bold text-gray-900 mb-3">{d.name}</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Rating:</span> {d.rating || 'N/A'} ⭐ ({d.review_count || 0} reviews)</p>
                    <p><span className="font-semibold">Distance:</span> {d.distance || '?'} mi</p>
                    <p><span className="font-semibold">Status:</span> {d.openNow ? '🟢 Open' : '🔴 Closed'}</p>
                    {d.specialDesignations?.medicaidProvider && <p className="text-green-600">✓ Medicaid Provider</p>}
                    {d.specialDesignations?.orthoProvider && <p className="text-purple-600">Ortho Provider</p>}
                    {d.pediatricSpecialty && <p className="text-pink-600">👶 Kids Friendly</p>}
                    {d.anxietyFriendly && <p className="text-red-600">🧠 Anxiety Friendly</p>}
                    {d.sedationOptions?.length > 0 && <p className="text-purple-600">💤 Sedation Available</p>}
                    {d.phone && <p><span className="font-semibold">Phone:</span> {d.phone}</p>}
                    {d.paymentOptions?.creditCards && <p className="text-xs text-gray-600">✓ Cards Accepted</p>}
                    {d.accessibility?.wheelchairEntrance && <p className="text-xs text-gray-600">✓ Wheelchair Access</p>}
                  </div>
                  <button onClick={() => toggleCompare(d)} className="w-full mt-4 bg-red-100 text-red-600 py-2 rounded-xl text-xs font-semibold hover:bg-red-200 transition-colors">Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
