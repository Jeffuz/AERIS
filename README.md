# AERIS: Autonomous Emergency Response & Intelligence System 🚁🆘

## Inspiration 🌪️📉
During disasters, **over 60% of victims lose phone service**, cutting them off from emergency help.  
Rescue teams are forced to search blindly, wasting precious hours while lives hang in the balance.  
We realized **search and rescue needs to be faster, smarter, and autonomous**.  
That’s why we built **AERIS** — AI drones that find victims and guide rescuers automatically.

## What it does 🎯
- 🚁 Locates victims needing urgent care using autonomous drone navigation.
- 🚑 Dispatches first responders directly to the victims' coordinates.

## How we built it 🛠️
- 🎨 Front end: Next.js, Tailwind CSS, Shadcn/ui, Leaflet, Butterfly for a smooth, responsive command dashboard.
- 🎥 Live Video Streaming: Dockerized NGINX RTMP server + FFmpeg ingests the DJI drone feed
- 🧠 AI agents: Dain for intelligent mission control orchestration, including hazard detection and hospital coordination.
- 🚀 CV Pipeline Pipeline: FastAPI server exposing REST endpoints to ingest frames, run YOLOv8 object detection, invoke Groq LLaMA for victim triage, and persist results to Supabase
- 🗄️ Database: Supabase for real-time detection/event logging
- 👁️ Object detection: Ultralytics YOLOv8 custom model trained on composed disaster datasets (humans, fire, smoke, flood, debris, collapse) for live inference
- 📞 Emergency Response Automation: Dain agents locate the nearest hospitals based on pinned coordinates, list phone numbers and distances, and automate emergency calls via Twilio API

## Challenges we ran into 🧩
- 🔄 Getting hospitals and dispatchers synced with Supabase without massive lag.
- 🧠 Designing complex systems combining computer vision, AI agents, and real-time routing without everything breaking.

## Accomplishments that we're proud of 🏆
- 🖥️ Displaying urgent victim and hazard data in a clean, intuitive way.
- 🚑 Getting first responders moving toward critical victims faster than traditional search teams.

## What we learned 📚
- 🤯 AI agents are **wildly hard** to coordinate when they actually need to act in the real world.
- 🧹 Always design a **stupid simple MVP first**, then layer complexity *only after* basic success.

## What's next for AERIS 🚀
- 🤖 Fully autonomous dispatching without human coordination.
- 🔍 Smarter triage: better hazard detection, victim urgency evaluation, and threat prioritization.
