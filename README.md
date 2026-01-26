# Overview
Cloudi is a centralized memory system for all popular AI agents, including a voice agent. It provides a full, long-term documentation of the user's experiences, personality and preferences, and lets agents browse in this database to find relevant details that help them answer certain prompts. After each conversation exchange, the memory database updates -- a new node appears in the neuron network.

This allows a user to speak to cloudi voice agent about an idea anywhere through their mobile, and then continue working on the idea on their desktop. They may also generate a 3D model in meshy and then precede to make a game with claude code with that model.
We are also building the voice agent to be able to evolve and mirror the user. This agent will become the user's second brain and be able to perform tasks for the user with knowledge of their memory.

<img width="1697" height="964" alt="Screenshot 2026-01-18 at 12 27 48" src="https://github.com/user-attachments/assets/914a7c27-8a63-424a-afdc-cbae7d6a1581" />

# Inspiration
Everyday users increasingly rely on multiple LLMs for different tasks, but every switch fractures context and forces them to start over. We were inspired by the gap between how users expect AI to remember long-term work and how siloed, forgetful today’s LLM experiences actually are.

# What it does
Cloudi provides a persistent, shared memory layer that sits above individual LLMs, allowing users to continue the same project across models without reintroducing context. Every interaction is summarized, stored, and visualized in an interactive neuron-map interface that users can explore, edit, and resume from.

# How we built it
## Frontend: Framework & Core

Next.js 16 - React framework with App Router React 19 - UI library with hooks (useState, useEffect, useCallback, useMemo, useRef) TypeScript - Type safety throughout

## Styling

Tailwind CSS - Utility-first CSS with custom configurations CSS Variables - For theming (dark mode with cyan/purple gradient accents)

Animation & Visualization

Framer Motion - Page transitions, component animations, AnimatePresence for mount/unmount D3-force - Physics-based graph simulation for the memory node visualization react-zoom-pan-pinch - Pan/zoom controls for the graph canvas

## UI Components

Lucide React - Icon library clsx + tailwind-merge (via cn utility) - Conditional class merging

## Backend: Core FastAPI Python

Memory/Database GetZep PostgreSQL

AI Services/APIs: OpenAI API Gemini API Anthropic (Claude) API LiveKit API TheTokenCompany SDK

# What's next for Cloudi
For the future, we aim to make Cloudi an AI companion that is integrated into daily life, constantly learning about you, mirroring your actions, and providing you with valuable insights. In terms of design, we will add a better filtering, pinning, and editing system for the memories. We will also add physics that show categories breaking into smaller units. In terms of the infrastructure, we aim to secure our database and prepare our product for the market. We also hope to gain partnerships with more AI agents to diversify our models and chat memories. In order to make the most use of storage and context windows, we would like to use tools that reduce our tokens and provide a succinct summary of memories.

