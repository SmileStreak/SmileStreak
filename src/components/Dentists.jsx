import React, { useEffect, useState, useContext, useMemo, useRef } from "react";
import {
  MapPin, Star, Clock, Heart, Phone, ChevronRight, TrendingUp, Award,
  Navigation, X, CheckCircle2, AlertCircle, Calendar, Users,
  DollarSign, Filter, Search, Sliders, Globe, Car,
  Menu, BarChart3, Sparkles, Shield, HelpCircle, AlertTriangle,
  Wifi, Coffee, Baby, CreditCard, Languages as LanguagesIcon, ExternalLink, Share2,
  Image as ImageIcon, Zap, Target, Bot, Volume2,
  Thermometer, Plane, GraduationCap, MessageCircle, Brain, Moon
} from "lucide-react";
import { TranslationContext } from "../App";
import Presence from "./Presence";

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

const getInsuranceEstimate = () => ({
  reason: "SmileStreak cannot verify plan-level coverage. Contact your insurer and the dental office to confirm benefits."
});

const procedures = ["cleaning", "filling", "crown", "rootCanal", "extraction", "implant", "whitening"];

const dentistPhotoFallback = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f1f4f5"/><g fill="none" stroke="#74828a" stroke-linecap="round" stroke-linejoin="round" stroke-width="8"><rect x="128" y="116" width="144" height="112" rx="8"/><circle cx="174" cy="154" r="13"/><path d="m136 214 48-43 37 32 21-19 22 24"/></g><text x="200" y="278" fill="#626b73" font-family="Arial,sans-serif" font-size="20" text-anchor="middle">Photo unavailable</text></svg>`)}`;

const handleDentistPhotoError = (event) => {
  event.currentTarget.onerror = null;
  event.currentTarget.alt = "Photo unavailable";
  event.currentTarget.src = dentistPhotoFallback;
};

// Procedure recommendations based on symptoms
const discussionTopics = ["Tooth pain", "Sensitivity", "Chipped tooth", "Missing tooth", "Tooth color", "Bleeding gums", "Bad breath", "Jaw discomfort"];

const dentistComparisonRows = [
  { label: "Rating", value: (d) => d.rating ? `${d.rating} / 5${d.review_count ? ` · ${d.review_count} reviews` : ""}` : "Not listed" },
  { label: "Distance", value: (d) => d.distance ? `${d.distance} mi` : "Not listed" },
  { label: "Open now", value: (d) => typeof d.openNow === "boolean" ? (d.openNow ? "Open" : "Closed") : "Not listed" },
  { label: "Phone", value: (d) => d.phone ? <a href={`tel:${d.phone}`}>{d.phone}</a> : "Not listed" },
  { label: "Medicaid", value: (d) => d.specialDesignations?.medicaidProvider ? "Provider listed" : "Not listed" },
  { label: "Orthodontics", value: (d) => d.specialDesignations?.orthoProvider ? "Provider listed" : "Not listed" },
  { label: "Kids friendly", value: (d) => d.pediatricSpecialty ? "Listed" : "Not listed" },
  { label: "Anxiety friendly", value: (d) => d.anxietyFriendly ? "Listed" : "Not listed" },
  { label: "Sedation", value: (d) => d.sedationOptions?.length ? d.sedationOptions.join(", ") : "Not listed" },
  { label: "Cards accepted", value: (d) => d.paymentOptions?.creditCards ? "Listed" : "Not listed" },
  { label: "Wheelchair access", value: (d) => d.accessibility?.wheelchairEntrance ? "Listed" : "Not listed" },
];

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
  const [locationErrorMessage, setLocationErrorMessage] = useState("");
  const [favoritesStorageWarning, setFavoritesStorageWarning] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotoAttributions, setSelectedPhotoAttributions] = useState([]);
  const [selectedPhotoGoogleMapsUri, setSelectedPhotoGoogleMapsUri] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [searchRadius, setSearchRadius] = useState(31);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
  const [accessibilityFilters, setAccessibilityFilters] = useState({ wheelchair: false });
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const dentistDialogReturnFocusRef = useRef(null);

  const translationKeys = {
    title: "Find Dentists", subtitle: "Find nearby dental offices and confirm plan coverage directly.",
    yourInsurance: "Insurance plan (optional)", selectInsurance: "Select your plan",
    recommended: "Recommended", bestRated: "Best Rated", closest: "Closest",
    loading: "Finding dentists near you...", noDentists: "No dentists found nearby",
    expandSearch: "Try expanding your search radius", openNow: "Open now", closed: "Closed",
    milesAway: "miles away", likelyAccepts: "Likely accepts", mayNotAccept: "May not accept",
    directions: "Directions", call: "Call", savedDentists: "Saved Dentists",
    viewDetails: "View Details", photos: "Photos", website: "Website",
    filters: "Filters", searchRadius: "Search Radius", results: "results",
    minRating: "Minimum Rating", onlyOpenNow: "Only Open Now", clearFilters: "Clear All",
    locationDenied: "Location access is blocked. Allow it in browser settings and try again.",
    locationUnavailable: "Your location couldn’t be determined. Check device location services and try again.",
    locationTimeout: "The location request took too long. Try again when you have a stronger signal.",
    dentistLoadFailed: "Dentists couldn’t be loaded right now. Check your connection and retry.",
    noMatchingDentists: "No dentists match this search.",
    noMatchingDentistsDesc: "Clear the name search and filters to see the full list again.",
    clearSearchAndFilters: "Clear search and filters"
  };

  useEffect(() => {
    let active = true;
    const loadTranslations = async () => {
      const translations = {};
      for (const [key, value] of Object.entries(translationKeys)) {
        translations[key] = await t(value);
      }
      if (active) setTranslatedText(translations);
    };
    loadTranslations().catch((error) => console.error("Could not load dentist finder translations:", error));
    return () => { active = false; };
  }, [currentLanguage, t]);

  useEffect(() => {
    const titleId = showPhotoModal ? null : showAIAssistant ? "dentist-assistant-title" : showPriceEstimator ? "treatment-cost-title" : showTreatmentPlanner ? "visit-prep-title" : selectedDentist ? "dentist-details-title" : showCompare ? "compare-dentists-title" : showFavorites ? "saved-dentists-title" : null;
    const dialog = showPhotoModal
      ? document.querySelector('[role="dialog"][aria-label="Dental office photo"]')
      : titleId ? document.getElementById(titleId)?.closest('[role="dialog"]') : null;

    if (!dialog) {
      if (dentistDialogReturnFocusRef.current?.isConnected) dentistDialogReturnFocusRef.current.focus();
      dentistDialogReturnFocusRef.current = null;
      return undefined;
    }

    if (!dentistDialogReturnFocusRef.current) dentistDialogReturnFocusRef.current = document.activeElement;
    const getFocusable = () => [...dialog.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true");
    const focusable = getFocusable();
    (focusable[0] || dialog).focus();

    const handleDialogKeys = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (showPhotoModal) { setShowPhotoModal(false); setSelectedPhoto(null); }
        else if (showAIAssistant) { setShowAIAssistant(false); setAiResponse(""); setAiQuery(""); }
        else if (showPriceEstimator) setShowPriceEstimator(false);
        else if (showTreatmentPlanner) setShowTreatmentPlanner(false);
        else if (selectedDentist) setSelectedDentist(null);
        else if (showCompare) setShowCompare(false);
        else if (showFavorites) setShowFavorites(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = getFocusable();
      if (!items.length) { event.preventDefault(); dialog.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleDialogKeys);
    return () => document.removeEventListener("keydown", handleDialogKeys);
  }, [showPhotoModal, showAIAssistant, showPriceEstimator, showTreatmentPlanner, selectedDentist, showCompare, showFavorites]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('favoriteDentists') || '[]');
      if (!Array.isArray(saved)) throw new TypeError("Saved dentist favorites are not a list");
      const placeIds = saved.map((item) => typeof item === "string" ? item : item?.id).filter(Boolean);
      setFavorites(placeIds);
      localStorage.setItem('favoriteDentists', JSON.stringify(placeIds));
    } catch (error) {
      console.error("Could not read saved dentist favorites:", error);
      setFavoritesStorageWarning(true);
    }
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
      const response = await fetch(`/api/places?placeId=${encodeURIComponent(placeId)}`);
      if (!response.ok) throw new Error("Failed to fetch details");
      const data = await response.json();
      setPlaceDetails(prev => ({ ...prev, [placeId]: data }));
    } catch (err) {
      console.error("Error fetching place details:", err);
    } finally {
      setLoadingDetails(prev => ({ ...prev, [placeId]: false }));
    }
  };

  useEffect(() => {
    if (!showFavorites) return;
    favorites.forEach((id) => {
      if (!dentists.some((dentist) => dentist.id === id)) fetchPlaceDetails(id);
    });
  }, [showFavorites, favorites, dentists]);

  const toggleFavorite = (dentist) => {
    const isFavorited = favorites.includes(dentist.id);
    const updated = isFavorited ? favorites.filter((id) => id !== dentist.id) : [...favorites, dentist.id];
    setFavorites(updated);
    try {
      localStorage.setItem('favoriteDentists', JSON.stringify(updated));
      setFavoritesStorageWarning(false);
    } catch (error) {
      console.error("Could not save dentist favorites:", error);
      setFavoritesStorageWarning(true);
    }
  };

  const isFavorite = (dentistId) => favorites.includes(dentistId);

  const toggleCompare = (dentist) => {
    if (selectedForCompare.some(d => d.id === dentist.id)) {
      setSelectedForCompare(selectedForCompare.filter(d => d.id !== dentist.id));
    } else if (selectedForCompare.length < 3) {
      setSelectedForCompare([...selectedForCompare, dentist]);
    }
  };

  const clearSearchAndFilters = () => {
    setSearchQuery("");
    setFilterOpenNow(false);
    setFilterMinRating(0);
    setSearchRadius(31);
    setAccessibilityFilters({ wheelchair: false });
  };

  // FIXED: AI Assistant function using Gemini with GEMINI_API_KEY
// Updated AI Assistant function using the new API endpoint
const askAIAssistant = async () => {
  if (!aiQuery.trim() || aiQuery.trim().length > 1200) return;
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
    setRecommendedProcedures([]);
  };

  // NEW: Filter dentists by accessibility features
  const applyAccessibilityFilters = (dentist) => {
    if (!accessibilityFilters.wheelchair) {
      return true;
    }
    
    return dentist.accessibility?.wheelchairEntrance === true;
  };

  // Use live Google Places results only; do not replace failures with invented listings or reviews.
  const fetchDentists = async (radius) => {
    setLoading(true);
    setLocationError(false);
    setLocationErrorMessage("");
    try {
      if (!navigator.geolocation) throw new Error("Geolocation is unavailable in this browser");
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 12000,
          maximumAge: 300000
        });
      });
      const { latitude, longitude } = position.coords;
      setUserLocation({ latitude, longitude });
      const params = new URLSearchParams({ lat: String(latitude), lng: String(longitude), radius: String(Math.min(radius * 1609.34, 50000)) });
      const response = await fetch(`/api/places?${params}`);
      if (!response.ok) throw new Error(`Google Places API error: ${response.status}`);
      const result = await response.json();
      const places = result.places || [];
      const dentists = places.map((place) => {
        const lat = place.location?.latitude;
        const lng = place.location?.longitude;
        const accessibility = {};
        if (place.accessibilityOptions) {
          accessibility.wheelchairEntrance = place.accessibilityOptions.wheelchairAccessibleEntrance || false;
          accessibility.wheelchairParking = place.accessibilityOptions.wheelchairAccessibleParking || false;
          accessibility.wheelchairRestroom = place.accessibilityOptions.wheelchairAccessibleRestroom || false;
          accessibility.wheelchairSeating = place.accessibilityOptions.wheelchairAccessibleSeating || false;
        }
        const paymentOptions = {};
        if (place.paymentOptions) {
          paymentOptions.creditCards = place.paymentOptions.acceptsCreditCards || false;
          paymentOptions.debitCards = place.paymentOptions.acceptsDebitCards || false;
          paymentOptions.nfcMobilePayments = place.paymentOptions.acceptsNfc || false;
          paymentOptions.cash = place.paymentOptions.acceptsCash || false;
          paymentOptions.insurance = place.paymentOptions.acceptsInsurance || false;
        }
        const hours = {};
        place.regularOpeningHours?.weekdayDescriptions?.forEach((description) => {
          const [day, time] = description.split(": ");
          hours[day] = time || "Closed";
        });
        const photos = place.photos?.map((photo) => ({
          name: photo.name,
          url: `/api/place-photo?name=${encodeURIComponent(photo.name)}`,
          googleMapsUri: photo.googleMapsUri || null,
          authorAttributions: photo.authorAttributions || []
        })) || [];
        const name = place.displayName?.text || "Unknown";
        return {
          id: place.id,
          name,
          address: place.formattedAddress || "No address",
          rating: place.rating,
          review_count: place.userRatingCount || 0,
          lat,
          lng,
          openNow: place.currentOpeningHours?.openNow,
          phone: place.nationalPhoneNumber,
          website: place.websiteUri,
          mapsLink: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(name)}&destination_place_id=${place.id}`,
          distance: lat && lng ? Number(getDistanceMiles(latitude, longitude, lat, lng)) : null,
          priceLevel: place.priceLevel || null,
          photos,
          businessStatus: place.businessStatus,
          isRoyseCity: name.toLowerCase().includes("royse"),
          accessibility,
          paymentOptions,
          hours,
          offerings: {},
          amenities: {},
          planning: {},
          insuranceAccepted: {},
          specialDesignations: {},
          providerInfo: {},
          knowBeforeYouGo: []
        };
      });
      setDentists(dentists);
    } catch (error) {
      console.error("Unable to load nearby dentists:", error);
      setDentists([]);
      setLocationError(true);
      const message = error?.code === 1
        ? translatedText.locationDenied
        : error?.code === 2
          ? translatedText.locationUnavailable
          : error?.code === 3
            ? translatedText.locationTimeout
            : translatedText.dentistLoadFailed;
      setLocationErrorMessage(message || "Dentists couldn’t be loaded right now. Check your connection and retry.");
    } finally {
      setLoading(false);
    }
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
      
      return true;
    });
  }, [dentists, searchQuery, filterOpenNow, filterMinRating, searchRadius, 
      accessibilityFilters]);

  const getSortedDentists = () => {
    let sorted = [...filteredDentists];
    
    if (sortBy === "recommended") {
      // Royse City ONLY at the top for recommended sort
      const royseCity = sorted.filter(d => d.isRoyseCity);
      const others = sorted.filter(d => !d.isRoyseCity);
      
      const sortedOthers = others.sort((a, b) => {
        const scoreA = (a.rating || 0) * 10 - (a.distance ?? 99);
        const scoreB = (b.rating || 0) * 10 - (b.distance ?? 99);
        return scoreB - scoreA;
      });
      
      return [...royseCity, ...sortedOthers];
    }
    
    if (sortBy === "rating") {
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "distance") {
      return sorted.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
    }
    
    return sorted;
  };

  const sortedDentists = getSortedDentists();

  const getBadge = (dentist) => {
    if (dentist.rating >= 4.8 && dentist.review_count >= 50) {
      return { text: "Highly Rated", icon: Award };
    }
    if (dentist.distance !== null && dentist.distance !== undefined && dentist.distance < 2) {
      return { text: "Nearby", icon: MapPin };
    }
    return null;
  };

  const getPhotoUrl = (photoResource) => {
    if (!photoResource) return null;
    if (photoResource.url) return photoResource.url;
    if (photoResource.name) {
      return `/api/place-photo?name=${encodeURIComponent(photoResource.name)}`;
    }
    if (typeof photoResource === 'string') return photoResource;
    return null;
  };

  if (Object.keys(translatedText).length === 0) {
    return (
      <section className="space-y-6 pb-8">
        <div className="page-heading-surface page-heading-large">
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
      <div className="page-heading-surface page-heading-large relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-black">{translatedText.title}</h2>
              </div>
              <p className="text-base opacity-90">{translatedText.subtitle}</p>
            </div>
            <div className="flex gap-2">
              {/* NEW: Feature buttons - Now in a 2x2 grid on mobile */}
              <div className="grid grid-cols-2 gap-1 sm:flex sm:gap-2">
                <button
                  onClick={() => setShowAIAssistant(!showAIAssistant)}
                  className="dentists-tool-button rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 transition-colors hover:bg-slate-50 relative"
                  title="AI Assistant"
                  aria-label="Open dental question assistant"
                >
                  <Bot className="w-4 h-4" /><span>Ask a question</span>
                </button>
                <button
                  onClick={() => setShowPriceEstimator(!showPriceEstimator)}
                  className="dentists-tool-button rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 transition-colors hover:bg-slate-50"
                  title="Treatment cost questions"
                  aria-label="Open treatment cost estimator"
                >
                  <DollarSign className="w-4 h-4" /><span>Cost questions</span>
                </button>
                <button
                  onClick={() => setShowTreatmentPlanner(!showTreatmentPlanner)}
                  className="dentists-tool-button rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 transition-colors hover:bg-slate-50"
                  title="Dental visit prep"
                  aria-label="Open dental visit planner"
                >
                  <Calendar className="w-4 h-4" /><span>Plan a visit</span>
                </button>
                {selectedForCompare.length > 0 && (
                  <button onClick={() => setShowCompare(true)} className="dentists-tool-button rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 transition-colors hover:bg-slate-50 relative" aria-label={`Compare ${selectedForCompare.length} selected dentists`}>
                    <BarChart3 className="w-4 h-4" /><span>Compare</span>
                    <span aria-hidden="true" className="absolute -top-1 -right-1 w-5 h-5 bg-slate-100 text-slate-700 rounded-full text-xs font-bold flex items-center justify-center">{selectedForCompare.length}</span>
                  </button>
                )}
                {favorites.length > 0 && (
                  <button onClick={() => setShowFavorites(true)} className="dentists-tool-button rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 transition-colors hover:bg-slate-50 relative" aria-label={`Show ${favorites.length} saved dentists`}>
                    <Heart className="w-4 h-4 fill-current text-slate-700" /><span>Saved</span>
                    <span aria-hidden="true" className="absolute -top-1 -right-1 w-5 h-5 bg-slate-100 text-slate-700 rounded-full text-xs font-bold flex items-center justify-center">{favorites.length}</span>
                  </button>
                )}
                <button onClick={() => setShowFilters(!showFilters)} className={`dentists-tool-button rounded-lg border border-slate-200 px-3 py-2 transition-colors ${showFilters ? 'bg-slate-100 text-slate-900' : 'bg-white text-slate-700 hover:bg-slate-50'}`} aria-label="Toggle dentist filters" aria-expanded={showFilters}>
                  <Filter className="w-4 h-4" /><span>Filters</span>
                </button>
              </div>
            </div>
          </div>
          <div className="dentists-search relative">
            <label htmlFor="dentist-search" className="sr-only">Search dentists by name</label>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" aria-hidden="true" />
            <input id="dentist-search" type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by dentist name" className="w-full rounded-lg border border-slate-300 bg-white py-3.5 pl-12 pr-4 text-base text-slate-900 placeholder-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
        </div>
      </div>

      {favoritesStorageWarning && (
        <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-950">
          Saved dentist changes may last only for this session because browser storage couldn’t be accessed.
        </p>
      )}

      {/* NEW: AI Assistant Modal */}
      <Presence open={showAIAssistant}>
{showAIAssistant && (
        <div className="t-modal-backdrop fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="dentists-dialog bg-white rounded-[2rem] max-w-lg w-full p-8 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="dentist-assistant-title">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Bot className="w-6 h-6 text-blue-600" />
                <h3 id="dentist-assistant-title" className="text-2xl font-black text-gray-900">Dental AI Assistant</h3>
              </div>
              <button onClick={() => { setShowAIAssistant(false); setAiResponse(""); setAiQuery(""); }} className="text-gray-400 hover:text-gray-600" aria-label="Close dental question assistant">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Ask a general dental education question. This is not a diagnosis or treatment plan; contact a licensed dentist about personal symptoms.</p>
            <p id="assistant-privacy-note" className="text-xs leading-5 text-slate-600 mb-3">Your question is sent to Google Gemini to generate a response. Don’t include names, photos, contact details, or other identifying health information.</p>
            <div className="space-y-4">
              <label htmlFor="dental-question" className="sr-only">Your general dental education question</label>
              <textarea
                id="dental-question"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                maxLength={1200}
                aria-describedby="assistant-privacy-note assistant-question-count"
                placeholder="e.g., What's the difference between a crown and a filling? Or find me a dentist who accepts Medicaid..."
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none resize-none h-32"
              />
              <p id="assistant-question-count" className="-mt-3 text-right text-xs text-slate-600">{aiQuery.length}/1,200 characters</p>
              <button
                onClick={askAIAssistant}
                disabled={aiLoading || !aiQuery.trim()}
                className="dentist-dialog-primary w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div role="log" aria-live="polite" className="dentists-assistant-response bg-blue-50 p-4 rounded-xl border-2 border-blue-200 max-h-96 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{aiResponse}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
</Presence>

      {/* NEW: Price Estimator Modal */}
      <Presence open={showPriceEstimator}>
{showPriceEstimator && (
        <div className="t-modal-backdrop fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="dentists-dialog bg-white rounded-[2rem] max-w-lg w-full p-8 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="treatment-cost-title">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-blue-600" />
                <h3 id="treatment-cost-title" className="text-2xl font-black text-gray-900">Treatment cost questions</h3>
              </div>
              <button aria-label="Close treatment cost questions" onClick={() => setShowPriceEstimator(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="treatment-cost-procedure" className="block text-sm font-semibold text-gray-700 mb-2">Select procedure</label>
                <select
                  id="treatment-cost-procedure"
                  value={selectedProcedure}
                  onChange={(e) => setSelectedProcedure(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
                >
                  {procedures.map(proc => (
                    <option key={proc} value={proc}>
                      {proc.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              {selectedProcedure && (
                <div className="dentist-price-summary">
                  <p className="text-sm text-gray-700">Prices depend on the office, your care plan, and insurance benefits. Call the dental office for a written estimate.</p>
                </div>
              )}
              <div className="dentist-price-tip">
                <p>Before booking</p>
                <span>Ask the dental office about costs, insurance, and available payment options.</span>
              </div>
            </div>
          </div>
        </div>
      )}
</Presence>

      {/* NEW: Treatment Planner Modal */}
      <Presence open={showTreatmentPlanner}>
{showTreatmentPlanner && (
        <div className="t-modal-backdrop fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="dentists-dialog bg-white rounded-[2rem] max-w-lg w-full p-8 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="visit-prep-title">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-blue-600" />
                <h3 id="visit-prep-title" className="text-2xl font-black text-gray-900">Dental visit prep</h3>
              </div>
              <button aria-label="Close dental visit prep" onClick={() => setShowTreatmentPlanner(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Choose a topic you may want to discuss with a dental professional.</p>
            <div className="space-y-4">
              <label htmlFor="visit-prep-topic" className="sr-only">Choose a topic to discuss at your dental visit</label>
              <select
                id="visit-prep-topic"
                value={symptom}
                onChange={(e) => handleSymptomChange(e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
              >
                <option value="">Select a symptom...</option>
                {discussionTopics.map(sym => (
                  <option key={sym} value={sym}>
                    {sym.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </option>
                ))}
              </select>
              {symptom && (
                <div role="status" className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  SmileStreak cannot determine a diagnosis or recommend treatment from a symptom. Contact a licensed dental professional for advice; if you are experiencing a severe or urgent problem, seek prompt care.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
</Presence>

      {/* IMPROVED: Cleaner Filters UI */}
      {showFilters && !locationError && (
        <div className="dentists-filter-panel bg-white rounded-[2rem] p-6 shadow-lg border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Filters</h3>
            <button onClick={clearSearchAndFilters} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">Clear All</button>
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
                      <button key={rating} aria-pressed={filterMinRating === rating} onClick={() => setFilterMinRating(rating)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filterMinRating === rating ? 'bg-blue-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'}`}>
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
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                  <input type="checkbox" checked={accessibilityFilters.wheelchair} onChange={(e) => setAccessibilityFilters(prev => ({ ...prev, wheelchair: e.target.checked }))} className="w-5 h-5 rounded accent-blue-600" />
                  <span className="text-sm text-gray-700">Wheelchair-accessible entrance reported</span>
                </label>
                <p className="px-2 text-xs leading-5 text-slate-600">This filter shows only offices Google explicitly lists as having an accessible entrance. Missing listing details don’t confirm whether a location is accessible.</p>
              </div>
            </div>

            {/* The current directory source does not provide searchable specialty or travel details. */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Details to confirm with an office</h4>
              <p className="text-sm leading-5 text-slate-600">The listing source doesn’t provide reliable filters for interpreters, sensory needs, family care, sedation, or travel access. Use each office’s call or website link to check these details before visiting.</p>
            </div>
          </div>
        </div>
      )}

      {/* INSURANCE */}
      {!locationError && (
        <div className="dentists-insurance bg-white rounded-[2rem] p-6 shadow-md border border-blue-100">
          <label className="text-sm font-semibold text-gray-700 mb-2 block">{translatedText.yourInsurance}</label>
          <select value={insurance} onChange={(e) => setInsurance(e.target.value)} className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none font-medium">
            <option value="">{translatedText.selectInsurance}</option>
            {['Delta Dental', 'Aetna', 'Cigna', 'MetLife', 'UnitedHealthcare', 'Medicaid', 'Medicare', 'Blue Cross Blue Shield', 'Guardian', 'Humana'].map(ins => <option key={ins}>{ins}</option>)}
          </select>
        </div>
      )}

      {/* SORT */}
      {!locationError && dentists.length > 0 && (
        <div className="dentists-sort flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'recommended', label: translatedText.recommended, icon: <Award className="w-4 h-4" /> },
            { id: 'rating', label: translatedText.bestRated, icon: <Star className="w-4 h-4" /> },
            { id: 'distance', label: translatedText.closest, icon: <Navigation className="w-4 h-4" /> }
          ].map(sort => (
            <button key={sort.id} aria-pressed={sortBy === sort.id} onClick={() => setSortBy(sort.id)} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold whitespace-nowrap transition-all text-sm ${sortBy === sort.id ? 'bg-blue-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'}`}>
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
        <div role="alert" className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-6 h-6 text-rose-700 mx-auto mb-3" aria-hidden="true" />
          <p className="text-slate-800 font-medium mb-4">{locationErrorMessage}</p>
          <button disabled={loading} onClick={() => fetchDentists(searchRadius)} className="rounded-lg bg-slate-900 text-white px-5 py-2.5 font-semibold transition-colors duration-200 ease-out hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:cursor-wait disabled:opacity-60">{loading ? "Trying…" : "Try again"}</button>
        </div>
      )}

      {/* NO RESULTS */}
      {!loading && !locationError && sortedDentists.length === 0 && (
        <div className="text-center py-12 px-6 bg-slate-50 border border-slate-200 rounded-xl">
          <MapPin className="w-7 h-7 text-slate-500 mx-auto mb-4" aria-hidden="true" />
          {dentists.length > 0 ? (
            <>
              <p className="text-slate-900 font-semibold text-lg">{translatedText.noMatchingDentists}</p>
              <p className="text-sm text-slate-600 mt-2 mb-5">{translatedText.noMatchingDentistsDesc}</p>
              <button type="button" onClick={clearSearchAndFilters} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-colors duration-200 ease-out hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700">
                {translatedText.clearSearchAndFilters}
              </button>
            </>
          ) : (
            <>
              <p className="text-slate-900 font-semibold text-lg">{translatedText.noDentists}</p>
              <p className="text-sm text-slate-600 mt-2">{translatedText.expandSearch}</p>
            </>
          )}
        </div>
      )}

      {/* DENTIST CARDS */}
      {!locationError && (
        <div className="dentist-results">
          <p className="px-1 text-xs leading-5 text-slate-600">Business listings, ratings, and photos provided by <span className="font-semibold">Google Maps</span>. Ratings and availability can change; confirm details with the dental office. Google checks for and removes fake reviews when identified, but does not verify every review. <a href="https://support.google.com/contributionpolicy/answer/7422880?hl=en" target="_blank" rel="noreferrer" className="underline underline-offset-2">Google Maps review policy</a>.</p>
          {sortedDentists.map((d) => {
            const estimate = insuranceEstimates[d.id];
            const badge = getBadge(d);
            const isInCompare = selectedForCompare.some(s => s.id === d.id);
            const hasDirectoryAmenities = Object.values(d.accessibility || {}).some(Boolean)
              || Object.values(d.paymentOptions || {}).some(Boolean)
              || Boolean(d.languages?.length);

            return (
              <article key={d.id} className={`dentist-result ${isInCompare ? "is-selected" : ""}`}>
                {d.photos && d.photos.length > 0 && (
                  <div className="dentist-result__photos mb-3">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {d.photos.slice(0, 4).map((photo, idx) => {
                        const photoUrl = getPhotoUrl(photo);
                        return photoUrl ? (
                          <button key={idx} onClick={() => { setSelectedPhoto(photoUrl); setSelectedPhotoAttributions(photo.authorAttributions || []); setSelectedPhotoGoogleMapsUri(photo.googleMapsUri || null); setShowPhotoModal(true); }} className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden hover:scale-105 transition-transform">
                            <img src={photoUrl} alt={`${d.name} photo ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" 
                              onError={handleDentistPhotoError}
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
                      {badge && <span className="dentist-feature-badge"><badge.icon aria-hidden="true" /> {badge.text}</span>}
                      {d.specialDesignations?.medicaidProvider && (
                        <span className="dentist-feature-badge"><Shield aria-hidden="true" /> Medicaid Provider</span>
                      )}
                      {d.specialDesignations?.orthoProvider && (
                        <span className="dentist-feature-badge"><Target aria-hidden="true" /> Ortho Provider</span>
                      )}
                      {/* NEW: Specialized badges */}
                      {d.pediatricSpecialty && (
                        <span className="dentist-feature-badge"><Baby aria-hidden="true" /> Kids Friendly</span>
                      )}
                      {d.anxietyFriendly && (
                        <span className="dentist-feature-badge"><Brain aria-hidden="true" /> Anxiety Friendly</span>
                      )}
                      {d.sedationOptions?.length > 0 && (
                        <span className="dentist-feature-badge"><Moon aria-hidden="true" /> Sedation Available</span>
                      )}
                      {d.travelFriendly && (
                        <span className="dentist-feature-badge"><Plane aria-hidden="true" /> Travel Friendly</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => toggleCompare(d)} aria-label={isInCompare ? `Remove ${d.name} from comparison` : `Compare ${d.name}`} aria-pressed={isInCompare} className={`dentist-icon-action ${isInCompare ? "is-active" : ""}`}><BarChart3 className="w-4 h-4" aria-hidden="true" /></button>
                    <button type="button" onClick={() => toggleFavorite(d)} aria-label={isFavorite(d.id) ? `Remove ${d.name} from saved dentists` : `Save ${d.name}`} aria-pressed={isFavorite(d.id)} className={`dentist-icon-action ${isFavorite(d.id) ? "is-active" : ""}`}><Heart className={`w-4 h-4 ${isFavorite(d.id) ? "fill-current" : ""}`} aria-hidden="true" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {d.rating && (
                    <div className="dentist-result-rating flex items-center gap-1 px-2 py-1" role="img" aria-label={`Google Maps rating ${d.rating} out of 5${d.review_count > 0 ? `, ${d.review_count} reviews` : ""}`}>
                      <Star className="w-4 h-4" aria-hidden="true" />
                      <span className="dentist-result-rating__value">{d.rating}</span>
                      {d.review_count > 0 && <span className="dentist-result-rating__reviews">({d.review_count})</span>}
                    </div>
                  )}
                  {typeof d.openNow === "boolean" && (
                    <div className={`dentist-result-meta flex items-center gap-1.5 ${d.openNow ? 'is-open' : 'is-closed'}`}>
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      <span>{d.openNow ? translatedText.openNow : translatedText.closed}</span>
                    </div>
                  )}
                  {d.distance !== null && d.distance !== undefined && (
                    <div className="dentist-result-meta">
                      <Navigation className="w-4 h-4" aria-hidden="true" />
                      <span>{d.distance} mi</span>
                    </div>
                  )}
                  {d.priceLevel && (
                    <div className="dentist-result-meta">
                      <DollarSign className="w-4 h-4" aria-hidden="true" />
                      <span>{'$'.repeat(d.priceLevel)}</span>
                    </div>
                  )}
                </div>
                
                {/* Accessibility & Amenities Icons */}
                {hasDirectoryAmenities && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {d.accessibility?.wheelchairEntrance && (
                      <span className="dentist-feature-badge">
                        <Wheelchair className="w-3 h-3" /> Wheelchair Access
                      </span>
                    )}
                    {d.paymentOptions?.creditCards && (
                      <span className="dentist-feature-badge">
                        <CreditCard className="w-3 h-3" /> Cards Accepted
                      </span>
                    )}
                    {d.paymentOptions?.nfcMobilePayments && (
                      <span className="dentist-feature-badge">
                        <Zap className="w-3 h-3" /> NFC Payments
                      </span>
                    )}
                      {d.paymentOptions?.insurance && (
                      <span title="Google Maps lists insurance payments; ask the office whether your specific plan is accepted." className="dentist-feature-badge">
                        <Shield className="w-3 h-3" /> Insurance payment listed
                      </span>
                    )}
                    {/* NEW: Additional amenity icons */}
                    {d.languages?.slice(0, 2).map((language) => (
                      <span key={language} className="dentist-feature-badge">
                        <LanguagesIcon className="w-3 h-3" aria-hidden="true" /> {language}
                      </span>
                    ))}
                    {d.languages?.length > 2 && <span className="dentist-feature-badge">+{d.languages.length - 2} languages</span>}
                    {d.pediatricSpecialty && (
                      <span className="dentist-feature-badge">
                        <Baby className="w-3 h-3" /> Kids Welcome
                      </span>
                    )}
                  </div>
                )}
                
                {d.address && <p className="text-sm text-gray-600 mb-3 flex items-start gap-2"><MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />{d.address}</p>}
                
                {/* Know Before You Go Section for Royse City */}
                {d.knowBeforeYouGo && d.knowBeforeYouGo.length > 0 && (
                  <div className="dentist-prep-note mb-3 p-3">
                    <p className="dentist-prep-note__title">Know Before You Go</p>
                    <ul className="space-y-1">
                      {d.knowBeforeYouGo.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="dentist-prep-note__bullet" aria-hidden="true">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* NEW: Sedation Options */}
                {d.sedationOptions && d.sedationOptions.length > 0 && (
                  <div className="dentist-sedation-note mb-3">
                    <p><Moon aria-hidden="true" /> Sedation options</p>
                    <span>{d.sedationOptions.join(' · ')}</span>
                  </div>
                )}
                
                {insurance && estimate && (
                  <div className="dentist-coverage-note mb-4 flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-amber-800">Plan coverage is unverified</p>
                      <p className="text-xs text-gray-700 mt-1">{estimate.reason}</p>
                    </div>
                  </div>
                )}
                <div className={`dentist-result-actions grid gap-2 ${d.phone ? "grid-cols-3" : "grid-cols-2"}`}>
                  <a href={d.mapsLink} target="_blank" rel="noopener noreferrer" className="dentist-action-button dentist-action-button--primary"><MapPin className="w-3.5 h-3.5" aria-hidden="true" /><span>{translatedText.directions}</span></a>
                  {d.phone && <a href={`tel:${d.phone}`} className="dentist-action-button"><Phone className="w-3.5 h-3.5" aria-hidden="true" /><span>{translatedText.call}</span></a>}
                  <button type="button" onClick={() => { fetchPlaceDetails(d.id); setSelectedDentist(d); }} className="dentist-action-button"><ChevronRight className="w-3.5 h-3.5" aria-hidden="true" /><span>{translatedText.viewDetails}</span></button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* PHOTO MODAL */}
      <Presence open={showPhotoModal && selectedPhoto}>
{showPhotoModal && selectedPhoto && (
        <div className="t-modal-backdrop fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center gap-3 p-4" role="dialog" aria-modal="true" aria-label="Dental office photo" onClick={() => { setShowPhotoModal(false); setSelectedPhoto(null); }}>
          <button aria-label="Close dental office photo" className="absolute top-4 right-4 text-white hover:text-gray-300" onClick={() => { setShowPhotoModal(false); setSelectedPhoto(null); }}><X className="w-8 h-8" /></button>
          <img onClick={(event) => event.stopPropagation()} src={selectedPhoto} alt="Dental office photo from Google Maps" className="max-w-full max-h-[82vh] rounded-xl" />
          <p className="max-w-full text-center text-sm text-white">
            {selectedPhotoAttributions.length ? selectedPhotoAttributions.map((author, index) => (
              <React.Fragment key={`${author.displayName}-${index}`}>
                {index > 0 ? ", " : "Photo by "}
                {author.uri ? <a href={author.uri} target="_blank" rel="noreferrer" className="underline" onClick={(event) => event.stopPropagation()}>{author.displayName}</a> : author.displayName}
              </React.Fragment>
            )) : ""} · {selectedPhotoGoogleMapsUri ? <a href={selectedPhotoGoogleMapsUri} target="_blank" rel="noreferrer" className="underline" onClick={(event) => event.stopPropagation()}>View on Google Maps</a> : "Google Maps"}
          </p>
        </div>
      )}
</Presence>

      {/* DETAILS MODAL */}
      <Presence open={selectedDentist}>
{selectedDentist && (
        <div className="t-modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="dentists-dialog bg-white rounded-[2rem] max-w-2xl w-full p-8 shadow-2xl my-8" role="dialog" aria-modal={!showPhotoModal} aria-hidden={showPhotoModal} inert={showPhotoModal} aria-labelledby="dentist-details-title">
            <div className="flex items-center justify-between mb-6">
              <h3 id="dentist-details-title" className="text-2xl font-black text-gray-900">{selectedDentist.name}</h3>
              <button aria-label="Close dentist details" onClick={() => setSelectedDentist(null)} className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="dentist-details-contact">
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
                        <span key={key} className="dentist-detail-chip">
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
                        <span key={key} className="dentist-detail-chip">
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
                          <span key={key} className="dentist-detail-chip">
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
                        <span key={key} className="dentist-detail-chip">
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
                      <div key={idx} className="dentist-profile-row">
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
                      <span key={idx} className="dentist-detail-chip">
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
                        <button key={idx} onClick={() => { setSelectedPhoto(photoUrl); setSelectedPhotoAttributions(photo.authorAttributions || []); setSelectedPhotoGoogleMapsUri(photo.googleMapsUri || null); setShowPhotoModal(true); }} className="aspect-square rounded-xl overflow-hidden hover:scale-105 transition-transform">
                          <img src={photoUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" 
                                onError={handleDentistPhotoError}
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
</Presence>

      {/* FAVORITES MODAL */}
      <Presence open={showFavorites}>
{showFavorites && (
        <div className="t-modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="dentists-dialog bg-white rounded-[2rem] max-w-lg w-full p-8 max-h-[80vh] overflow-y-auto shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="saved-dentists-title">
            <div className="flex items-center justify-between mb-6">
              <h3 id="saved-dentists-title" className="text-2xl font-black text-gray-900">{translatedText.savedDentists}</h3>
              <button aria-label="Close saved dentists" onClick={() => setShowFavorites(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            {favorites.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No saved dentists yet</p>
            ) : (
              <div className="space-y-3">
                {favorites.map(id => {
                  const dentist = dentists.find((item) => item.id === id);
                  const details = placeDetails[id];
                  const name = dentist?.name || details?.displayName?.text || "Saved dental office";
                  const address = dentist?.address || details?.formattedAddress || "Current listing details load when nearby search returns this office.";
                  return (
                  <div key={id} className="p-4 bg-gray-50 rounded-xl flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900">{name}</p>
                      <p className="text-sm text-gray-600">{address}</p>
                      {dentist?.distance && <p className="text-xs text-blue-600 mt-1">{dentist.distance} miles away</p>}
                    </div>
                    <button aria-label={`Remove ${name} from saved dentists`} onClick={() => toggleFavorite({ id })} className="text-red-500 hover:text-red-600"><X className="w-5 h-5" /></button>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      )}
</Presence>

      {/* COMPARE MODAL */}
      <Presence open={showCompare && selectedForCompare.length > 0}>
{showCompare && selectedForCompare.length > 0 && (
        <div className="t-modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="dentists-dialog bg-white rounded-[2rem] max-w-4xl w-full p-8 max-h-[80vh] overflow-y-auto shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="compare-dentists-title">
            <div className="flex items-center justify-between mb-6">
              <h3 id="compare-dentists-title" className="text-2xl font-black text-gray-900">Compare dentists</h3>
              <button aria-label="Close dentist comparison" onClick={() => setShowCompare(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="dentist-compare-scroll" role="region" aria-label="Dentist comparison" tabIndex={0}>
              <table className="dentist-compare-table" style={{ minWidth: `${180 + 190 * selectedForCompare.length}px` }}>
                <thead>
                  <tr>
                    <th scope="col">Details</th>
                    {selectedForCompare.map((d) => (
                      <th scope="col" key={d.id}>{d.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dentistComparisonRows.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      {selectedForCompare.map((d) => (
                        <td key={d.id}>{row.value(d)}</td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">Actions</th>
                    {selectedForCompare.map((d) => (
                      <td key={d.id}>
                        <button type="button" aria-label={`Remove ${d.name} from comparison`} onClick={() => toggleCompare(d)} className="dentist-compare-remove">Remove</button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
</Presence>
    </section>
  );
}
