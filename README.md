# Smile Streak

## Overview
Smile Streak is a behavioral health web application designed to help users build consistent daily dental habits while reducing friction to real-world dental care. The platform integrates habit formation research, uncertainty-aware analytics, AI-assisted interpretation, facial scan feedback, and location-based provider discovery into a single focused experience.

Rather than maximizing features, Smile Streak emphasizes consistency, recovery, interpretability, and responsible guidance.

The project originated from personal difficulty maintaining routines after missed days, alongside frustration with how difficult it is to evaluate dental care options transparently and responsibly.

---

## Problem Statement

Many people understand the importance of daily dental care yet struggle with consistency. Missed days often lead to discouragement, broken streaks, and eventual abandonment. At the same time, identifying a trustworthy dentist aligned with one’s insurance, location, and expectations remains fragmented and opaque.

Smile Streak addresses both problems by:

- Supporting sustainable habit formation without perfection pressure  
- Making dental care more accessible through contextual provider discovery  
- Using AI responsibly to interpret behavioral patterns rather than replace professional care  

---

## Core Features

### Daily Habit Tracking
- Morning brushing, night brushing, and flossing  
- Built-in timers encouraging correct brushing duration  
- Visual indicators reinforcing completion  

---

### Recovery System
- One recovery day per week  
- Preserves streak continuity without enabling abuse  
- Encourages long-term consistency instead of all-or-nothing behavior  

---

### Reflection Intelligence
- Recovery triggers a brief reflection prompt  
- Responses stored locally to promote self-awareness  
- Prompts intentionally lightweight to avoid friction  
- Designed to reinforce metacognition rather than impose judgment  

---

### AI Pattern Scan
- Uses the Gemini API to analyze behavioral patterns after sufficient data is collected  
- Generates natural-language summaries of routines, trends, and missed behaviors  
- Explicitly communicates uncertainty when confidence is low  
- Designed to simulate responsible human interpretation rather than automated scoring  

---

### Facial Scan Feedback System
- Uses camera-based input to scan facial and oral region indicators  
- Provides general feedback related to visible oral health cues and hygiene patterns  
- Designed for awareness and habit reinforcement, not diagnosis  
- Feedback is framed with uncertainty and avoids clinical claims  

---

### Nearby Dentist Discovery
- Uses Google Places API for reliable, global provider search  
- Surfaces ratings, proximity, and contextual signals  
- Designed to reduce search friction while avoiding medical claims  

---

### Dentist Chatbot
- AI-powered chatbot for answering general dental questions  
- Provides educational guidance based on common dental knowledge  
- Avoids diagnostic or treatment recommendations  
- Reinforces when users should consult a licensed professional  

---

### Feedback System
- In-app feedback modal allows users to submit suggestions or issues  
- Currently routed through Formspree  
- Structured for future database storage to enable anonymized insight aggregation  
- Designed to support research-driven iteration and portfolio analysis  

---

## Impact and User Validation

Smile Streak has demonstrated early real-world usage and behavioral impact.

- 72 active users across more than 10 countries  
- User testimonials consistently report improved habit consistency  
- Feedback collected from dentists, pre-dental students, and healthcare-interested users  
- External input from Harvard dental students and Texas A and M pre-dental students informed feature refinement  

Users frequently report that the streak system and recovery design help them maintain routines even after missed days, reducing all-or-nothing behavior.

This early validation supports the core hypothesis that behavior-focused design can improve adherence to daily oral care.

---

## Uncertainty-Aware Insights

Smile Streak deliberately avoids drawing conclusions from insufficient data.

- Insights appear only after minimum thresholds are met  
- Limited data triggers explicit uncertainty messaging  
- Behavioral patterns are withheld until statistically meaningful  
- Confidence framing prevents overinterpretation  

This approach prioritizes responsible interpretation over premature analytics.

---

## Longitudinal Insight Synthesis

When sufficient data exists, Smile Streak generates a concise behavioral overview.

- Synthesizes task-level and temporal patterns  
- Generated only when reliability thresholds are met  
- Uses descriptive, non-prescriptive language  
- Withheld entirely when confidence is insufficient  

This mirrors how a human analyst would responsibly summarize small behavioral datasets.

---

## Design Decisions

### AI as Interpreter, Not Authority
Gemini is used to translate behavioral data into understandable insights, not to provide diagnosis or prescriptive health guidance.

### Limited Recovery Days
Unlimited forgiveness undermines habit formation. Weekly limits balance compassion with accountability.

### Reflection Over Punishment
Missed days trigger reflection instead of streak loss, shifting focus from guilt to learning.

### Places API for Reliability
Google Places provides consistent global coverage and structured provider data, reducing fragmentation and improving user trust.

---

## Design Rationale and Interpretability

Throughout development, decisions were guided by how users interpret feedback.

Smile Streak prioritizes:

- Trends over single-day judgments  
- Explanations over raw metrics  
- Transparency over false precision  

This framing reduces anxiety-driven disengagement and promotes reflective habit formation.

---

## Limitations and Open Questions

Smile Streak intentionally acknowledges its constraints:

- Insights rely on small, self-reported datasets  
- AI summaries reflect patterns, not medical conclusions  
- Facial scan feedback is observational and non-clinical  
- Insurance inference remains probabilistic  
- Habit consistency does not equate to clinical outcomes  

These constraints reinforce the need for cautious interpretation in behavioral tools.

---

## Ethical Boundaries and Medical Disclaimer

Smile Streak is designed for education and habit awareness only.  
It does not provide medical diagnosis or treatment recommendations.

AI-generated insights and chatbot responses are interpretive and informational, not professional advice. Users should consult licensed dental professionals for personalized guidance.

---

## Tech Stack

- React  
- Vite  
- Tailwind CSS  
- Google Places API  
- Gemini API (behavioral insight generation and chatbot)  
- Formspree (feedback routing)  
- Local storage persistence  

---

## What I Learned

Building Smile Streak demonstrated that behavior change depends more on design choices than raw functionality. Small decisions such as limiting recovery, reducing friction, and communicating uncertainty meaningfully affect engagement.

The project also highlighted the responsibility required when integrating AI into health-adjacent tools, where interpretability and restraint matter more than automation.

---

## Future Improvements

- Database-backed feedback storage for longitudinal analysis  
- Optional account system for cross-device synchronization  
- Expanded provider data sources and insurance validation  
- Improved facial scan accuracy and validation safeguards  
- Accessibility and localization improvements  
- Research evaluation of behavioral retention outcomes  

---

## Status

Actively maintained and evolving.