import { TIPS } from "../data";
import { Lightbulb, ExternalLink, XCircle, CheckCircle, AlertCircle, BookOpen, Sparkles, TrendingUp, Newspaper, ChevronRight, RefreshCw } from "lucide-react";
import { useState, useEffect, useContext, useCallback } from "react";
import { TranslationContext } from "../App";

const MYTHS = [
{ id: 1, myth: "You should rinse your mouth with water right after brushing", truth: "False! Wait 30 minutes before rinsing. Toothpaste needs time to work its magic.", icon: "💧", isMyth: true },
{ id: 2, myth: "Whitening toothpaste damages your enamel", truth: "False! ADA-approved whitening toothpaste is safe when used as directed.", icon: "✨", isMyth: true },
{ id: 3, myth: "You need to brush harder to clean better", truth: "False! Gentle brushing is more effective and won't damage your gums.", icon: "🪥", isMyth: true },
{ id: 4, myth: "Flossing once a day is recommended by dentists", truth: "True! Daily flossing removes plaque between teeth that brushing can't reach.", icon: "🧵", isMyth: false },
{ id: 5, myth: "Sugar-free soda is safe for your teeth", truth: "False! The acid in soda (even sugar-free) erodes enamel over time.", icon: "🥤", isMyth: true },
{ id: 6, myth: "Electric toothbrushes clean better than manual ones", truth: "True! Studies show electric brushes reduce plaque by 21% more than manual.", icon: "⚡", isMyth: false },
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

const BLOG_ARTICLES = [
{
title: "Building SmileStreak: The Journey of Creating a Dental AI App",
description: "How I built a dental habit tracker with AI smile scanning as a high school student, the struggles, lessons learned, and the ethics behind health technology.",
tag: "Founder Story",
tagColor: "#3b82f6",
emoji: "🚀",
url: "https://medium.com/@eddiecherianj"
},
{
title: "AI in Dentistry: How SmileStreak is Bringing Intelligent Oral Care to Your Phone",
description: "Artificial intelligence is transforming healthcare. Here's how SmileStreak uses AI-powered smile scanning and a dental chatbot to make better oral care accessible to everyone.",
tag: "Health Tech",
tagColor: "#10b981",
emoji: "🤖",
url: "https://medium.com/@eddiecherianj"
}
];

export default function Tips() {
const { t, currentLanguage } = useContext(TranslationContext);
const [texts, setTexts] = useState({});
const [selectedMyth, setSelectedMyth] = useState(null);
const [revealedMyths, setRevealedMyths] = useState(new Set());
const [didYouKnowIndex, setDidYouKnowIndex] = useState(0);
const [factAnimating, setFactAnimating] = useState(false);
const [visibleMythCount, setVisibleMythCount] = useState(4);

useEffect(() => {
const idx = Math.floor(Math.random() * DID_YOU_KNOW.length);
setDidYouKnowIndex(idx);
}, []);

useEffect(() => {
const translateAll = async () => {
const translations = {
dentalTips: await t("Dental Tips & Facts"),
expertAdvice: await t("Expert advice backed by science"),
mythBusters: await t("Myth Busters"),
testKnowledge: await t("Test your dental knowledge!"),
myth: await t("MYTH!"),
true: await t("TRUE!"),
tapReveal: await t("Tap to reveal the truth →"),
revealed: await t("revealed"),
proTip: await t("Pro Tip of the Day"),
proTipText: await t("Brush your teeth at a 45-degree angle toward your gumline. This removes more plaque and prevents gum disease!"),
source: await t("Source"),
learnMore: await t("Learn More"),
adaDesc: await t("Comprehensive oral health research"),
cdcDesc: await t("Public health guidelines and basics"),
whoDesc: await t("Global oral health statistics"),
important: await t("Important"),
disclaimer: await t("These tips are for prevention and education only, based on published dental research. This app does not provide medical diagnosis or treatment recommendations. Always consult with a licensed dental professional for personalized advice, treatment, or if you have concerns about your oral health."),
didYouKnow: await t("Did You Know?"),
newFact: await t("New fact"),
fromTheBlog: await t("From the Blog"),
blogDesc: await t("Deep dives into dental health, technology, and the story behind SmileStreak."),
readArticle: await t("Read Article"),
showMore: await t("Show more myths"),
showLess: await t("Show less"),
};
for (const myth of MYTHS) {
translations[`myth${myth.id}`] = await t(myth.myth);
translations[`truth${myth.id}`] = await t(myth.truth);
}
setTexts(translations);
};
translateAll();
}, [currentLanguage, t]);

const handleMythClick = (mythId) => {
if (revealedMyths.has(mythId)) return;
setSelectedMyth(mythId);
setRevealedMyths(prev => new Set([...prev, mythId]));
};

const rotateFact = useCallback(() => {
setFactAnimating(true);
setTimeout(() => {
setDidYouKnowIndex(prev => (prev + 1) % DID_YOU_KNOW.length);
setFactAnimating(false);
}, 300);
}, []);

const translatedMyths = MYTHS.map((myth) => ({
...myth,
myth: texts[`myth${myth.id}`] || myth.myth,
truth: texts[`truth${myth.id}`] || myth.truth
}));

const visibleMyths = translatedMyths.slice(0, visibleMythCount);

return (
<div className="space-y-6 pb-8">
{/* Header */}
<div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-500 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
<div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
<div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
<div className="relative z-10">
<div className="flex items-center gap-2 mb-2">
<Lightbulb className="w-6 h-6" />
<h2 className="text-2xl font-black">{texts.dentalTips || "Dental Tips & Facts"}</h2>
</div>
<p className="text-sm opacity-90">{texts.expertAdvice || "Expert advice backed by science"}</p>
</div>
</div>

  {/* Did You Know - Rotating Fact */}
  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 flex-1">
        <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-xl">🧠</span>
        </div>
        <div className="flex-1">
          <p className="font-bold text-amber-900 mb-1 text-sm">{texts.didYouKnow || "Did You Know?"}</p>
          <p
            className="text-sm text-gray-700 leading-relaxed transition-opacity duration-300"
            style={{ opacity: factAnimating ? 0 : 1 }}
          >
            {DID_YOU_KNOW[didYouKnowIndex]}
          </p>
        </div>
      </div>
      <button
        onClick={rotateFact}
        className="flex-shrink-0 w-8 h-8 bg-amber-200 hover:bg-amber-300 rounded-full flex items-center justify-center transition-colors"
        title={texts.newFact || "New fact"}
      >
        <RefreshCw className="w-4 h-4 text-amber-700" />
      </button>
    </div>
  </div>

  {/* MYTH BUSTERS */}
  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 shadow-lg border-2 border-purple-200">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 className="font-black text-gray-900">{texts.mythBusters || "Myth Busters"}</h3>
        <p className="text-xs text-gray-600">{texts.testKnowledge || "Test your dental knowledge!"}</p>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-3">
      {visibleMyths.map((item) => {
        const isRevealed = revealedMyths.has(item.id);
        return (
          <button
            key={item.id}
            onClick={() => !isRevealed && handleMythClick(item.id)}
            className={`text-left p-4 rounded-2xl border-2 transition-all duration-300 ${
              isRevealed
                ? item.isMyth
                  ? "bg-red-50 border-red-300"
                  : "bg-green-50 border-green-300"
                : "bg-white border-purple-200 hover:border-purple-400 hover:shadow-md cursor-pointer"
            }`}
            disabled={isRevealed}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm mb-2">{item.myth}</p>
                {isRevealed ? (
                  <div className={`flex items-start gap-2 p-3 rounded-xl ${item.isMyth ? "bg-red-100" : "bg-green-100"}`}>
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
                  <p className="text-xs text-purple-600 font-medium">{texts.tapReveal || "Tap to reveal the truth →"}</p>
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
        className="text-xs text-purple-600 font-semibold hover:text-purple-800 transition-colors"
      >
        {visibleMythCount === 4 ? (texts.showMore || "Show more myths") : (texts.showLess || "Show less")}
      </button>
    </div>
  </div>

  {/* Daily Pro Tip */}
  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-5">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
        <TrendingUp className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="font-bold text-gray-900 mb-1">💡 {texts.proTip || "Pro Tip of the Day"}</p>
        <p className="text-sm text-gray-700">
          {texts.proTipText || "Brush your teeth at a 45-degree angle toward your gumline. This removes more plaque and prevents gum disease!"}
        </p>
      </div>
    </div>
  </div>

  {/* Tips Grid */}
  <div className="grid grid-cols-1 gap-4">
    {TIPS.map((tip, index) => (
      <div
        key={tip.id}
        className="group bg-white p-5 rounded-2xl shadow-md border border-blue-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">{tip.icon}</div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">{tip.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{tip.content}</p>
          </div>
        </div>
        {tip.sourceLink && (
          <a href={tip.sourceLink} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-2">
            <span>{texts.source || "Source"}: {tip.source}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    ))}
  </div>

  {/* Blog Section */}
  <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl p-6 shadow-xl">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
        <Newspaper className="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 className="font-black text-white">{texts.fromTheBlog || "From the Blog"}</h3>
        <p className="text-xs text-blue-300">{texts.blogDesc || "Deep dives into dental health, technology, and the story behind SmileStreak."}</p>
      </div>
    </div>

    <div className="space-y-3 mt-4">
      {BLOG_ARTICLES.map((article, index) => (
        <a
          key={index}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-4 transition-all group"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
              {article.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: article.tagColor + "33", color: article.tagColor }}
                >
                  {article.tag}
                </span>
              </div>
              <p className="font-bold text-white text-sm leading-snug mb-1">{article.title}</p>
              <p className="text-xs text-blue-300 leading-relaxed line-clamp-2">{article.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform flex-shrink-0 mt-1" />
          </div>
        </a>
      ))}
    </div>

    <a
      href="https://medium.com/@eddiecherianj"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
    >
      <span>View all articles on Medium</span>
      <ExternalLink className="w-4 h-4" />
    </a>
  </div>

  {/* Learn More Section */}
  <div className="bg-white p-6 rounded-3xl shadow-lg border border-blue-100">
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
          className="flex items-center justify-between p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors group">
          <div>
            <p className="font-semibold text-gray-900 text-sm">{link.name}</p>
            <p className="text-xs text-gray-600">{link.desc}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
        </a>
      ))}
    </div>
  </div>

  {/* Disclaimer */}
  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
    <div className="flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
      <div className="text-xs text-gray-700 leading-relaxed">
        <strong className="text-gray-900">{texts.important || "Important"}:</strong>{" "}
        {texts.disclaimer || "These tips are for prevention and education only, based on published dental research. This app does not provide medical diagnosis or treatment recommendations. Always consult with a licensed dental professional for personalized advice, treatment, or if you have concerns about your oral health."}
      </div>
    </div>
  </div>
</div>
);
}