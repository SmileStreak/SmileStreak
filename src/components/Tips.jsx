import { TIPS } from "../data";
import { ExternalLink, XCircle, CheckCircle, AlertCircle, BookOpen, RefreshCw } from "lucide-react";
import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { TranslationContext } from "../App";
import { translateBatch } from "../utils/translate.js";

const MYTHS = [
{ id: 1, myth: "You should rinse your mouth with water right after brushing", truth: "Spit out the excess toothpaste instead of rinsing straight away; rinsing can wash away fluoride left on your teeth.", icon: "💧", isMyth: true },
{ id: 2, myth: "Whitening toothpaste damages your enamel", truth: "False! ADA-approved whitening toothpaste is safe when used as directed.", icon: "✨", isMyth: true },
{ id: 3, myth: "You need to brush harder to clean better", truth: "False! Gentle brushing is more effective and won't damage your gums.", icon: "🪥", isMyth: true },
{ id: 4, myth: "Flossing once a day is recommended by dentists", truth: "True! Daily flossing removes plaque between teeth that brushing can't reach.", icon: "🧵", isMyth: false },
{ id: 5, myth: "Sugar-free soda is safe for your teeth", truth: "False! The acid in soda (even sugar-free) erodes enamel over time.", icon: "🥤", isMyth: true },
{ id: 6, myth: "A manual toothbrush cannot clean as well as a powered one", truth: "Both manual and powered toothbrushes can clean effectively. Use a soft-bristled brush and gentle pressure.", icon: "⚡", isMyth: true },
{ id: 7, myth: "Baby teeth don't matter since they fall out anyway", truth: "False! Healthy baby teeth guide the growth of permanent teeth and affect speech development.", icon: "🍼", isMyth: true },
{ id: 8, myth: "You only need to see a dentist if something hurts", truth: "False! Regular checkups catch problems early before they become painful or expensive.", icon: "🦷", isMyth: true },
{ id: 9, myth: "Bleeding gums while brushing is normal", truth: "False! Bleeding gums are usually a sign of gum disease and should be checked by a dentist.", icon: "🩸", isMyth: true },
{ id: 10, myth: "Mouthwash can replace brushing", truth: "False! Mouthwash is a supplement, not a substitute. You still need to brush and floss.", icon: "🫧", isMyth: true }
];

const DID_YOU_KNOW = [
"Your mouth produces about 1 liter of saliva per day, which helps neutralize acids and protect your teeth.",
"Tooth enamel is the hardest substance in the human body, even stronger than bone.",
"The average person spends about 38.5 days brushing their teeth over a lifetime.",
"Humans have two sets of teeth in their lifetime. Sharks can have up to 50 sets.",
"Gum disease affects nearly half of adults over 30 in the United States.",
"Your tongue print is as unique as your fingerprint.",
"People who drink 3 or more glasses of soda daily have 62% more tooth decay than those who don't.",
"The first toothbrush with bristles was invented in China in 1498.",
"Oral health is directly linked to heart health. Gum bacteria can enter the bloodstream and affect your heart.",
"Smiling releases endorphins, which naturally reduce stress and boost mood."
];

export default function Tips() {
const { currentLanguage } = useContext(TranslationContext);
const [texts, setTexts] = useState({});
const [revealedMyths, setRevealedMyths] = useState(new Set());
const [didYouKnowIndex, setDidYouKnowIndex] = useState(() => Math.floor(Math.random() * DID_YOU_KNOW.length));
const [factAnimating, setFactAnimating] = useState(false);
const [visibleMythCount, setVisibleMythCount] = useState(4);
const factTimerRef = useRef(null);

useEffect(() => {
let active = true;
const translations = {
dentalTips: "Dental Tips & Facts",
expertAdvice: "Everyday answers, with sources to explore",
mythBusters: "Myth Busters",
testKnowledge: "Test your dental knowledge!",
myth: "MYTH!",
true: "TRUE!",
tapReveal: "Select to read the explanation",
revealed: "revealed",
proTip: "Pro Tip of the Day",
proTipText: "Brush your teeth at a 45-degree angle toward your gumline. This removes more plaque and prevents gum disease!",
source: "Source",
learnMore: "Learn More",
adaDesc: "Comprehensive oral health research",
cdcDesc: "Public health guidelines and basics",
whoDesc: "Global oral health statistics",
important: "Important",
disclaimer: "These tips are for prevention and education only, based on published dental research. This app does not provide medical diagnosis or treatment recommendations. Always consult with a licensed dental professional for personalized advice, treatment, or if you have concerns about your oral health.",
didYouKnow: "Did You Know?",
newFact: "New fact",
fromTheBlog: "From the Blog",
blogDesc: "Deep dives into dental health, technology, and the story behind SmileStreak.",
readArticle: "Read Article",
showMore: "Show more myths",
showLess: "Show less",
};
const translateAll = async () => {
for (const myth of MYTHS) {
translations[`myth${myth.id}`] = myth.myth;
translations[`truth${myth.id}`] = myth.truth;
}
DID_YOU_KNOW.forEach((fact, index) => { translations[`fact${index}`] = fact; });
TIPS.forEach((tip, index) => {
translations[`tipTitle${index}`] = tip.title;
translations[`tipContent${index}`] = tip.content;
});
const keys = Object.keys(translations);
const values = await translateBatch(Object.values(translations), currentLanguage, "en");
if (active) setTexts(Object.fromEntries(keys.map((key, index) => [key, values[index]])));
};
translateAll().catch((error) => {
console.error("Could not load dental tip translations:", error);
if (active) setTexts(translations);
});
return () => { active = false; };
}, [currentLanguage]);

const handleMythClick = (mythId) => {
if (revealedMyths.has(mythId)) return;
setRevealedMyths(prev => new Set([...prev, mythId]));
};

const rotateFact = useCallback(() => {
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
setDidYouKnowIndex(prev => (prev + 1) % DID_YOU_KNOW.length);
return;
}
window.clearTimeout(factTimerRef.current);
setFactAnimating(true);
factTimerRef.current = window.setTimeout(() => {
setDidYouKnowIndex(prev => (prev + 1) % DID_YOU_KNOW.length);
setFactAnimating(false);
}, 300);
}, []);

useEffect(() => () => window.clearTimeout(factTimerRef.current), []);

const translatedMyths = MYTHS.map((myth) => ({
...myth,
myth: texts[`myth${myth.id}`] || myth.myth,
truth: texts[`truth${myth.id}`] || myth.truth
}));

const visibleMyths = translatedMyths.slice(0, visibleMythCount);

return (
<div className="space-y-6 pb-8">
{/* Header */}
<div className="page-heading-surface relative overflow-hidden">
<div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
<div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
<div className="relative z-10">
<div className="flex items-center gap-2 mb-2">
<h2 className="text-2xl font-black">{texts.dentalTips || "Dental Tips & Facts"}</h2>
</div>
<p className="text-sm opacity-90">{texts.expertAdvice || "Everyday answers, with sources to explore"}</p>
</div>
</div>

  {/* Did You Know - Rotating Fact */}
  <aside className="tips-fact-note" aria-live="polite">
    <div className="tips-fact-note__copy">
      <p className="tips-fact-note__label">{texts.didYouKnow || "Did You Know?"}</p>
      <p
        className="tips-fact-note__fact"
        style={{ opacity: factAnimating ? 0 : 1 }}
      >
        {texts[`fact${didYouKnowIndex}`] || DID_YOU_KNOW[didYouKnowIndex]}
      </p>
    </div>
    <button
      onClick={rotateFact}
      className="tips-fact-note__refresh"
      type="button"
      title={texts.newFact || "New fact"}
      aria-label={texts.newFact || "Show another dental fact"}
    >
      <RefreshCw className="w-4 h-4" />
    </button>
  </aside>

  {/* MYTH BUSTERS */}
  <section className="tips-myths-panel rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
    <div className="mb-3">
      <div>
        <h3 className="font-semibold text-slate-900">{texts.mythBusters || "Myth Busters"}</h3>
        <p className="text-xs text-gray-600">{texts.testKnowledge || "Test your dental knowledge!"}</p>
      </div>
    </div>

    <div className="divide-y divide-slate-200">
      {visibleMyths.map((item) => {
        const isRevealed = revealedMyths.has(item.id);
        return (
          <button
            key={item.id}
            onClick={() => !isRevealed && handleMythClick(item.id)}
            aria-pressed={isRevealed}
            aria-disabled={isRevealed}
            className={`w-full text-left py-4 transition-colors duration-200 ${
              isRevealed
                ? "cursor-default"
                : "hover:bg-slate-50 cursor-pointer"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm mb-2">{item.myth}</p>
                {isRevealed ? (
                    <div className={`tips-myth-answer flex items-start gap-2 p-3 rounded-xl ${item.isMyth ? "bg-red-100" : "bg-green-100"}`} role="status" aria-live="polite">
                    {item.isMyth ? (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`text-xs font-bold mb-1 ${item.isMyth ? "text-red-700" : "text-green-700"}`}>
                        {item.isMyth ? (texts.myth || "MYTH!") : (texts.true || "TRUE!")}
                      </p>
                      <p className="text-xs text-gray-700">{item.truth}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-medium">{texts.tapReveal || "Tap to reveal the truth →"}</p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>

    <div className="mt-4 flex items-center justify-between">
      <div className="bg-white/50 rounded-xl px-3 py-2 text-center">
        <p className="text-xs text-gray-600">
          <span className="font-semibold">{revealedMyths.size}</span> / {MYTHS.length} {texts.revealed || "revealed"}
        </p>
      </div>
      <button
        onClick={() => setVisibleMythCount(prev => prev === 4 ? MYTHS.length : 4)}
        className="text-xs text-slate-700 font-semibold hover:text-slate-900 transition-colors"
      >
        {visibleMythCount === 4 ? (texts.showMore || "Show more myths") : (texts.showLess || "Show less")}
      </button>
    </div>
  </section>

  {/* Daily Pro Tip */}
  <aside className="border-l border-slate-300 py-1 pl-4">
    <p className="font-semibold text-slate-900 mb-1">{texts.proTip || "A small technique reminder"}</p>
    <p className="max-w-3xl text-sm leading-6 text-slate-600">
      {texts.proTipText || "Hold your brush at about 45 degrees to the gumline and use gentle, short strokes."}
    </p>
  </aside>

  {/* Tips Grid */}
  <div className="divide-y divide-slate-200">
    {TIPS.map((tip, index) => (
      <article
        key={`tip-${index}`}
        className="py-5 first:pt-0 last:pb-0"
      >
        <h3 className="font-bold text-gray-900 mb-1">{texts[`tipTitle${index}`] || tip.title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{texts[`tipContent${index}`] || tip.content}</p>
        {tip.sourceLink && (
          <a href={tip.sourceLink} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-2">
            <span>{texts.source || "Source"}: {tip.source}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </article>
    ))}
  </div>

  {/* Blog link */}
  <section className="border-t border-slate-200 py-5">
    <h3 className="font-semibold text-slate-900">{texts.fromTheBlog || "From the Blog"}</h3>
    <p className="mt-1 text-sm leading-6 text-slate-600">{texts.blogDesc || "Writing about dental habits and the story behind SmileStreak."}</p>
    <a
      href="https://medium.com/@eddiecherianj"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand)] underline decoration-slate-300 underline-offset-4 hover:decoration-current"
    >
      <span>Read on Medium</span>
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  </section>

  {/* Learn More Section */}
  <section className="tips-sources-panel bg-white p-6 rounded-3xl shadow-lg border border-blue-100">
    <div className="flex items-center gap-2 mb-4">
      <BookOpen className="w-5 h-5 text-blue-600" />
      <h2 className="text-lg font-bold text-gray-900">{texts.learnMore || "Learn More"}</h2>
    </div>
    <div className="space-y-3">
      {[
        { name: "American Dental Association", url: "https://www.ada.org/resources/research/science-and-research-institute/oral-health-topics", desc: texts.adaDesc || "Comprehensive oral health research" },
        { name: "CDC Oral Health", url: "https://www.cdc.gov/oralhealth/basics/index.html", desc: texts.cdcDesc || "Public health guidelines and basics" },
        { name: "WHO Oral Health", url: "https://www.who.int/news-room/fact-sheets/detail/oral-health", desc: texts.whoDesc || "Global oral health statistics" }
      ].map((link) => (
        <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
          className="tips-source-link flex items-center justify-between p-3 rounded-xl transition-colors group">
          <div>
            <p className="font-semibold text-gray-900 text-sm">{link.name}</p>
            <p className="text-xs text-gray-600">{link.desc}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
        </a>
      ))}
    </div>
  </section>

  {/* Disclaimer */}
  <aside className="tips-education-note bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
    <div className="flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
      <div className="text-xs text-gray-700 leading-relaxed">
        <strong className="text-gray-900">{texts.important || "Important"}:</strong>{" "}
        {texts.disclaimer || "These tips are for prevention and education only, based on published dental research. This app does not provide medical diagnosis or treatment recommendations. Always consult with a licensed dental professional for personalized advice, treatment, or if you have concerns about your oral health."}
      </div>
    </div>
  </aside>
</div>
);
}
