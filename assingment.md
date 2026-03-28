# Quiz 3

**School of Engineering, Applied Sciences and Technology**  
**Spring 2026 - Project**

- **Course Code:** BCS 309
- **Course Name:** Algorithms I
- **Project Deadline:** March 30, 2026
- **Instructor(s):** Dr. Arash Kermani

## Student Information

- **Student ID:** 20230003127
- **Student Name:** Nair, Rikhil Veneeth

---

# INSTRUCTIONS - READ CAREFULLY

- This is an individual project. Build an interactive web-based visualization tool for the assigned algorithm.
- You are encouraged to use AI tools (ChatGPT, Claude, Gemini, etc.) to help build your project.
- Your assigned project: **DFS, Topological Sort & Cycle Detection**
- Deploy your tool on GitHub Pages and submit the URL by the deadline.
- You must deeply understand the algorithm to explain it during the in-class demo.

---

# Course Learning Outcomes

| CLO | Description | PLO | Project |
|---|---|---:|:---:|
| **CLO-1** | Analyze worst-case running times of algorithms using asymptotic analysis. | 1 | X |
| **CLO-2** | Use appropriate algorithms for searching and sorting data. | 6 | X |
| **CLO-3** | Design algorithms to solve simple problems using strategies like divide and conquer, dynamic programming or greedy approach. | 2 | X |
| **CLO-4** | Apply key algorithm paradigms and methods of analysis to solve common problems. | 7 |  |
| **CLO-5** | Prove the NP-Completeness of problems using polynomial time reductions. | 5 |  |

---

# GRADE

| Component | Marks |
|---|---:|
| CLO1 | / 10 |
| CLO2 | / 10 |
| CLO3 | / 10 |
| Total | / 30 |

---

# Purpose of This Project

Your goal is to build an interactive teaching tool that is comprehensive enough to teach the assigned topic with the least possible number of remaining questions. A student who uses your tool should be able to fully understand the algorithm without needing much extra help.

Your grade will be based on the quality of your tool as a teaching resource. The better your tool teaches the topic, the higher your grade.

---

# Reference Tools

Before you start, take a close look at the three tools built by your instructor. Your project should look and work like these. Open each link, click around, and notice the layout, controls, animations, and educational content:

- **Sorting Algorithms:** https://arashkermaniprojects.github.io/sorting_algorithms/
- **String Matching:** https://arashkermaniprojects.github.io/string_matching/
- **Recurrence Relations:** https://arashkermaniprojects.github.io/recurrence-relations/

These tools show exactly what is expected from you. Use them as your benchmark.

---

# Project: DFS, Topological Sort & Cycle Detection

## Problem Description

Depth-First Search (DFS) explores a graph by going as deep as possible along each branch before backtracking. It uses a stack (or recursion) and runs in **O(V + E)** time. DFS assigns discovery and finish times to each vertex and classifies edges as **tree, back, forward, or cross** edges.

Two important applications:

1. **Topological Sort** - for a DAG, DFS produces a linear ordering of vertices such that for every edge `(u, v)`, `u` appears before `v`.
2. **Cycle Detection** - a directed graph has a cycle if and only if DFS discovers a back edge.

**Reference:** Cormen et al., *Introduction to Algorithms*, Chapter 22, Sections 22.3-22.4.  
See also: https://en.wikipedia.org/wiki/Depth-first_search

---

# What Your Tool Should Look Like

Let the user enter a directed graph as an adjacency list or choose from **3+ preset graphs**. Draw the graph as **SVG nodes and directed edges**. Animate DFS with stack, show discovery/finish times on nodes, color edges by type (**tree/back/forward/cross**).

---

# What You Must Show for Each CLO

Your tool must clearly cover these three CLOs. Each one is worth **10 marks**:

- **CLO-1:** Show **O(V+E)**. Show discovery/finish time intervals and the **parenthesis theorem**.
- **CLO-2:** DFS as **depth-first searching**. Show the **stack**. Classify edges using discovery/finish times.
- **CLO-3:** Show how DFS **decomposes the graph**. Show that **topological sort enables DP on DAGs** (e.g., longest path). Show **back edge = cycle**.

---

# What Your Tool Must Have

Your tool must include all of the features listed below. Look at the instructor's reference tools to see how each feature should work.

## 1. Layout and Design

- **Two-column layout:** Controls on the left side (~420px wide), visualization on the right. On small screens (**under 980px**), it should switch to a single column.
- **Dark theme:** Use a dark background with a clean color scheme. Use colors to show different algorithm states (e.g., red for comparing, green for sorted).
- **Legend:** Add a color-coded legend near the visualization that explains what each color means.

## 2. Control Panel (Left Side)

- **Custom input:** Let the user type in their own data to test the algorithm.
- **Preset examples:** Include at least **3 ready-made example buttons** that load interesting test cases.
- **Speed slider:** A slider that lets the user speed up or slow down the animation (**from 0.25x to 4x**). Show the current speed.
- **Playback buttons:** Add these buttons in this order: **Build Steps, Step, Play, Pause, Reset**.
- **Step counter:** Show something like **"Step 5 / 20"** so the user knows where they are.
- **Status:** Show the current state: **Idle, Ready, Playing, Paused, or Done**.

## 3. Statistics

- **Counters:** Show live counters for operations like comparisons, swaps, relaxations, etc. These must update as the animation plays.

## 4. Visualization Area

- **Main animation:** A clear, animated, color-coded picture of what the algorithm is doing (bars, nodes, tables, etc.).
- **Smooth transitions:** Changes should animate smoothly (**about 150-300ms per transition**).
- **Labels:** Show labels for pointers and indices the algorithm uses (like `i`, `j`, `k`, `pivot`).

## 5. Pseudocode Panel

- **Pseudocode:** Display the algorithm's pseudocode with **line numbers** using a **monospace font**.
- **Line highlighting:** Highlight the line currently being executed, and **auto-scroll** to keep it visible.
- **Tooltips:** When the user hovers over a pseudocode line, show a short explanation of what it does.

## 6. Step Explanation Box

- A box that explains what is happening right now in **plain English**, using actual values.  
  For example:  
  **"Comparing A[3]=7 with A[5]=2. Since 7 > 2, we swap."**  
  This must update at each step.

## 7. History Table

- A **scrollable table** showing what happened at each step (**keep the last 20-30 steps**).
- **Color-code the cells.**
- Clicking a row should **jump back to that step**.

## 8. Educational Content

- **Overview section:** A collapsible section explaining the algorithm: what it does, how it works, and when to use it.
- **Worked example:** At least one fully worked-out example with step-by-step explanation.
- **Key concepts:** Highlighted boxes for important ideas and common mistakes.

---

# How to Cover Each CLO in Your Tool

## CLO-1: Asymptotic Analysis (10 marks)

- **Complexity:** Show the time complexity (**best case, worst case, average case**) and space complexity.
- **Counter:** Count how many key operations (comparisons, swaps, etc.) happen during the animation.
- **Growth chart:** Let the user change the input size (`n`) and plot how the number of operations grows. Show the theoretical **O(f(n))** curve on the same chart.
- **Comparison:** Compare your algorithm with at least **one other algorithm** on the same chart.
- **Worst case:** Include a preset example that triggers the **worst case**, and explain why it is the worst case.

## CLO-2: Sorting and Searching (10 marks)

- **Role:** Show how **sorting or searching** is used inside your algorithm (or how your algorithm relates to sorting/searching).
- **Highlight:** Highlight the sorting/searching step clearly in the animation so it stands out.
- **Impact:** Show what goes wrong (or what changes) if you remove or change the sorting/searching step.

## CLO-3: Design Paradigm - D&C, DP, or Greedy (10 marks)

- **Label:** Say clearly which paradigm your algorithm uses: **Divide & Conquer, Dynamic Programming, or Greedy**.
- **Visualize:**  
  - If **D&C**: show the recursion tree and call stack.  
  - If **DP**: show the table filling up and point out overlapping subproblems.  
  - If **Greedy**: animate each greedy choice.
- **Compare:** Show an example where using a **different paradigm** would give a wrong or worse answer.

---

# Grading Rubric

**Total: 30 marks.** Each CLO is worth **10 marks**. The table below shows exactly how you will be graded.

## CLO-1

- **PI:** PI 1.1
- **Marks:** 10

**Criterion - Complexity Analysis:**  
Pseudocode with line highlighting and tooltips; step explanations with concrete values; operation counters; growth curve chart (actual vs theoretical); worst-case demo; comparison with alternative algorithm

- **Excellent (9-10):**  
  Growth curves, counters, worst-case demo, comparison with alternatives; pseudocode synced with animation, hover tooltips, detailed step explanations
- **Good (7-8):**  
  Counters displayed, complexity shown, some comparison; pseudocode with highlighting, generic explanations
- **Adequate (5-6):**  
  Complexity mentioned but not visualized; pseudocode shown but not synced
- **Poor (0-4):**  
  Missing or broken

## CLO-2

- **PI:** PI 7.2
- **Marks:** 10

**Criterion - Sorting/Searching:**  
Sorting/searching role clearly animated within the algorithm; interactive controls (build/step/play/pause/reset, speed slider); custom input; 3+ presets; history table; impact analysis

- **Excellent (9-10):**  
  Role clearly animated, impact analysis shown; all controls work, custom input, 3+ presets, clickable history table
- **Good (7-8):**  
  Connection explained and shown; most controls work, 2+ presets
- **Adequate (5-6):**  
  Briefly mentioned; basic play/pause, limited input
- **Poor (0-4):**  
  Missing or broken

## CLO-3

- **PI:** PI 1.1
- **Marks:** 10

**Criterion - Design Paradigm:**  
Smooth animated visualization of the algorithm; paradigm fully demonstrated (D&C recursion tree / DP table filling / Greedy choices); counterexample or comparison shown; color-coded legend

- **Excellent (9-10):**  
  Paradigm fully visualized with counterexample; smooth animations, clear color-coding, polished UI
- **Good (7-8):**  
  Paradigm partially visualized; good animations, minor visual issues
- **Adequate (5-6):**  
  Paradigm mentioned but not demonstrated; basic visualization
- **Poor (0-4):**  
  Missing or broken

---

# Performance Indicator (PI) Summary

This project covers two Performance Indicators (PIs). Each PI is worth at least **10 marks**:

| PI | Description | CLOs | Total Marks |
|---|---|---|---:|
| **PI 1.1** | Analyze the problem at hand to identify solutions | CLO-1 + CLO-3 | 20 |
| **PI 7.2** | Choose suitable techniques to a given computing-related problem | CLO-2 | 10 |

---

# Technology You Must Use

Your entire tool must work from a **single HTML file** - just like the instructor's reference tools. When someone opens your HTML file in a browser, everything should work immediately with **no setup, no installation, and no internet connection required**. All your **HTML, CSS, and JavaScript must be inside this one file**.

Use only these technologies:

- **HTML5** - for the page structure
- **CSS3** - for styling, colors, animations, and making it look good on different screen sizes
- **Vanilla JavaScript (ES6+)** - for all the logic, button clicks, and controlling the visualization
- **SVG** - for drawing the visualizations (bars, trees, graphs, tables, shapes)

**IMPORTANT:** Do **NOT** use any external libraries or frameworks.

- No React
- No Vue
- No D3.js
- No Chart.js
- No jQuery
- No Bootstrap
- Nothing external

Plain HTML, CSS, and JavaScript only.

This is **NOT** a programming course - the goal is for you to understand the algorithm deeply. The tool is the medium, not the end goal. But your tool must be **interactive and animated**.

---

# Using AI to Build Your Tool

You are allowed and encouraged to use AI tools like ChatGPT, Claude, Gemini, or Copilot to help you build your project. The instructor's own reference tools were built using AI. However, you must fully understand the algorithm you are visualizing.

During the in-class demo, you will be asked to explain how the algorithm works - if you cannot explain it, you will lose marks regardless of how good your tool looks.

---

# How to Prompt AI Step by Step

You will **NOT** get a working tool from a single prompt. Expect to go back and forth with the AI **20-50 times or more**. Here is a step-by-step approach that works well:

## Phase 1: Core Algorithm

- "Build a single-page HTML/CSS/JS tool that visualizes [algorithm name] step by step. Use SVG for the visualization. Use a dark theme with a two-column layout: controls on the left, visualization on the right. Include Build Steps, Step, Play, Pause, and Reset buttons."
- "Add a speed slider (0.25x to 4x) and a step counter showing 'X / Y'."
- "Add smooth CSS transitions (150-300ms) when elements change state."

## Phase 2: Educational Content

- "Add a pseudocode panel with line numbers. Highlight the currently executing line. Auto-scroll to keep it visible."
- "Add hover tooltips on each pseudocode line explaining what it does."
- "Add a step explanation box with plain-English descriptions using concrete values."

## Phase 3: Interactivity

- "Let the user input custom data. Add at least 3 preset example buttons."
- "Add a history table showing state at each step. Make rows clickable."
- "Add operation counters that update in real-time."

## Phase 4: CLO Sections

- "Add a complexity analysis section with interactive growth curves."
- "Add a section showing how sorting/searching is used in this algorithm."
- "Add a section demonstrating the [D&C / DP / Greedy] paradigm."

## Phase 5: Polish

- "Make the layout responsive - single column on screens under 980px."
- "Add a color-coded legend and key concept boxes."

---

# Tips for Working with AI

a) Start small. Build the basic visualization first, then add features one at a time.  
b) Be specific. Instead of saying "show bars," say "show vertical bars where the height is proportional to the value, max 300px."  
c) Copy-paste errors. When something breaks, paste the full error message into the AI chat.  
d) Test after every change. Do not send 5 prompts in a row without testing. Test after each one.  
e) Make sure you understand the code. If the AI writes something you do not understand, ask it to explain.  
f) Use the instructor's tools as examples. Tell the AI: "Look at this tool [paste URL] - I want mine to work like this."

---

# How to Put Your Tool Online (GitHub Pages)

You must publish your tool online using GitHub Pages. This means anyone can open your tool in a browser using a link like:

`https://your-username.github.io/your-repo-name/`

Follow these steps:

g) Go to https://github.com and create a free account (if you do not already have one).  
h) Create a new public repository. Give it a name related to your algorithm (for example: `dijkstra-visualizer`).  
i) Upload your single HTML file to the repository. It must be called `index.html`. Everything (HTML, CSS, JavaScript) should be inside this one file.  
j) Turn on GitHub Pages: In your repository, go to **Settings -> Pages -> under Source, choose 'Deploy from a branch' -> pick the main branch and / (root) folder -> click Save.**  
k) Wait about 1 minute. Your tool will be live at:  
`https://<your-username>.github.io/<repository-name>/`  
l) Test the link. Open it in your browser and make sure everything works before submitting.

---

# What You Must Submit

You must submit **both** of the following. If either one is missing, your mark will be **zero**.

m) **A working GitHub Pages link (.github.io)** - A working link to your deployed tool (e.g., `https://your-username.github.io/your-repo-name/`). The link must open a fully functional tool in the browser. If the link does not work, your mark is **zero**.

n) **The HTML file itself** - Upload your **single HTML file** to the LMS. This one file must contain everything (**HTML, CSS, and JavaScript**). If you do not submit the file, your mark is **zero**.

o) **In-class demo** - Present your tool to the class (**5-7 minutes**). You must use your tool to explain the algorithm and show how it covers all **3 CLOs**.

**WARNING:** If you do not submit BOTH a working GitHub Pages link AND the single HTML file, you will receive a mark of **ZERO**. No exceptions.

---

**Page 2 of 2**
