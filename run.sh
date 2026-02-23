#!/bin/bash

# Solar System Explorer — Autonomous Build Script
# 
# This script runs Claude Code in 4 chunks, each with a planning pass 
# followed by an execution pass. Each pass gets a fresh context window.
# The filesystem (code, plan files, CLAUDE.md) bridges between sessions.
#
# Prerequisites:
#   1. Claude Code CLI installed and authenticated (npm install -g @anthropic-ai/claude-code)
#   2. CLAUDE.md and MASTER_PROMPT.md in project root
#   3. Git initialized (script will do this if not)
#   4. Mac plugged into power (caffeinate keeps machine awake)
#   5. (Optional) Textures in public/textures/, audio in public/audio/
#
# Usage:
#   chmod +x run.sh
#   ./run.sh
#
# To resume from a specific chunk (e.g., chunk 3):
#   ./run.sh 3

set -e  # Exit on any error outside of Claude Code calls

# Prevent Mac from sleeping while this script runs
# -i: prevent idle sleep, -m: prevent disk sleep, -s: prevent system sleep
# (no -d flag: screen is allowed to turn off)
# -w $$: tied to this script's process ID, stops when script ends
caffeinate -ims -w $$ &
CAFFEINATE_PID=$!
trap "kill $CAFFEINATE_PID 2>/dev/null" EXIT

# --- Configuration ---
MAX_TURNS=150         # Max tool uses per Claude Code session
CHUNKS=4              # Total number of chunks
START_CHUNK=${1:-1}   # Resume from this chunk (default: 1)

# --- Color output helpers ---
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# --- Pre-flight checks ---
if [ ! -f "CLAUDE.md" ]; then
    log_error "CLAUDE.md not found in current directory. Run this script from the project root."
    exit 1
fi

if [ ! -f "MASTER_PROMPT.md" ]; then
    log_error "MASTER_PROMPT.md not found. Place it in the project root."
    exit 1
fi

if ! command -v claude &> /dev/null; then
    log_error "Claude Code CLI not found. Install it first: npm install -g @anthropic-ai/claude-code"
    exit 1
fi

# Initialize git if not already
if [ ! -d ".git" ]; then
    log_info "Initializing git repository..."
    git init
    git add CLAUDE.md MASTER_PROMPT.md run.sh
    git commit -m "Initial commit: project spec and build scripts"
fi

# Create progress tracking file
if [ ! -f "PROGRESS.md" ]; then
    echo "# Build Progress" > PROGRESS.md
    echo "" >> PROGRESS.md
    echo "Started: $(date)" >> PROGRESS.md
    echo "" >> PROGRESS.md
fi

# --- Chunk definitions ---
declare -a CHUNK_STEPS=("1-4" "5-8" "9-13" "14-18")
declare -a CHUNK_NAMES=(
    "Foundation (Scaffold, Scene, Planets, Orbits)"
    "Core Features (Interaction, Time, Textures, Moons)"
    "Extended Features (Asteroids, Spacecraft, Audio, Constellations, Size Comparison)"
    "Polish and Production (Postcard, Performance, Responsive, Polish, Build)"
)

# --- Main loop ---
for i in $(seq $((START_CHUNK - 1)) $((CHUNKS - 1))); do
    chunk_num=$((i + 1))
    steps="${CHUNK_STEPS[$i]}"
    name="${CHUNK_NAMES[$i]}"

    echo ""
    echo "=============================================="
    log_info "CHUNK ${chunk_num}/${CHUNKS}: ${name}"
    log_info "Steps: ${steps}"
    echo "=============================================="
    echo ""

    # ---- PLANNING PASS ----
    log_info "Phase 1/2: Planning steps ${steps}..."

    claude --dangerously-skip-permissions --max-turns ${MAX_TURNS} -p "
You are building a Solar System Explorer app. Read CLAUDE.md thoroughly first — it is the complete spec with every value you need.

Then read MASTER_PROMPT.md and find the section for CHUNK ${chunk_num} (Steps ${steps}).

YOUR TASK: Create a detailed implementation plan. Do NOT write any application code. Do NOT create or modify any source files except the plan file.

First, examine the current state of the project:
- List what files already exist
- Read key existing files (package.json, src/App.jsx, src/stores/useStore.js, src/utils/scaleConfig.js, and any component files relevant to steps ${steps})
- Understand what has already been built

Then create PLAN_CHUNK_${chunk_num}.md with:

For EACH step in the range ${steps}:
1. FILES TO CREATE OR MODIFY: exact file paths
2. WHAT EACH FILE NEEDS: key imports, component structure, functions, props
3. ORDER OF OPERATIONS: which file to edit first, dependencies between files
4. VALUES FROM SPEC: list the specific numbers from CLAUDE.md that this step uses (radii, distances, colors, etc.) — copy them into the plan so the execution pass does not need to search
5. POTENTIAL ISSUES: things from CLAUDE.md warnings that apply (e.g., Saturn UV fix, absolute time not accumulated, StrictMode disabled)
6. VERIFICATION: what npm run build should produce

Save ONLY the file PLAN_CHUNK_${chunk_num}.md. Do not modify any other files.
"

    # Verify plan was created
    if [ ! -f "PLAN_CHUNK_${chunk_num}.md" ]; then
        log_error "Plan file PLAN_CHUNK_${chunk_num}.md was not created. Stopping."
        echo "Chunk ${chunk_num} PLAN: FAILED - plan file not created" >> PROGRESS.md
        exit 1
    fi

    log_info "Plan created: PLAN_CHUNK_${chunk_num}.md"
    echo ""

    # ---- EXECUTION PASS ----
    log_info "Phase 2/2: Executing steps ${steps}..."

    claude --dangerously-skip-permissions --max-turns ${MAX_TURNS} -p "
You are building a Solar System Explorer app. 

STEP 1: Read CLAUDE.md thoroughly. This is the single source of truth for all values and architecture.

STEP 2: Read PLAN_CHUNK_${chunk_num}.md. This is the implementation plan. Follow it closely.

STEP 3: Execute the plan step by step. For EACH step:
  a. Read any existing files you need to modify BEFORE changing them (always read first, then edit)
  b. Implement the changes described in the plan
  c. Run: npm run build
  d. If build fails, read the error carefully, debug, and fix (up to 3 attempts per error)
  e. Once the step builds cleanly, run: git add . && git commit -m 'Step N: brief description'
  f. Append to PROGRESS.md: 'Step N: [DONE|FAILED] - what was built or what broke'

IMPORTANT RULES:
- All numeric values (radii, distances, speeds, tilts, colors) come from CLAUDE.md and scaleConfig.js. Never invent values.
- When creating React components for Three.js: use functional components with hooks (useRef, useFrame, useMemo)
- Version pinning matters: do not upgrade or change package versions
- If a texture or audio file does not exist, handle gracefully (fallback color, no crash, log error)
- React StrictMode must stay DISABLED in main.jsx
- If you cannot resolve a build error after 3 attempts, document it in BUILD_ISSUES.md with the exact error message and move to the next step

Begin executing now.
"

    # ---- POST-CHUNK VERIFICATION ----
    log_info "Verifying build after chunk ${chunk_num}..."
    
    if npm run build 2>&1; then
        log_info "Build succeeded after chunk ${chunk_num}."
        echo "" >> PROGRESS.md
        echo "--- Chunk ${chunk_num} build: PASSED ($(date)) ---" >> PROGRESS.md
        git add . && git commit -m "Chunk ${chunk_num} complete: Steps ${steps}" --allow-empty 2>/dev/null || true
    else
        log_warn "Build has issues after chunk ${chunk_num}. Attempting repair pass..."
        
        # ---- REPAIR PASS ----
        claude --dangerously-skip-permissions --max-turns 50 -p "
Read CLAUDE.md. The project build is currently failing after implementing steps ${steps}.

Run: npm run build

Read the error output carefully. Fix each error:
1. Read the file that has the error
2. Understand what went wrong
3. Fix it
4. Run npm run build again

Repeat until the build passes or you have attempted 5 fixes. Document any unresolved issues in BUILD_ISSUES.md.
"
        
        # Check again
        if npm run build 2>&1; then
            log_info "Build repaired after chunk ${chunk_num}."
            echo "--- Chunk ${chunk_num} build: REPAIRED ($(date)) ---" >> PROGRESS.md
            git add . && git commit -m "Chunk ${chunk_num} repaired: Steps ${steps}" 2>/dev/null || true
        else
            log_error "Build still failing after chunk ${chunk_num}. Check BUILD_ISSUES.md."
            echo "--- Chunk ${chunk_num} build: FAILED ($(date)) ---" >> PROGRESS.md
            log_warn "Continuing to next chunk. Manual intervention may be needed."
        fi
    fi

    echo ""
    log_info "Chunk ${chunk_num} finished."
    echo ""
done

# --- Summary ---
echo ""
echo "=============================================="
log_info "BUILD COMPLETE"
echo "=============================================="
echo ""
log_info "Check these files:"
echo "  PROGRESS.md        — status of each step"
echo "  BUILD_ISSUES.md    — any unresolved errors (if it exists)"
echo "  PLAN_CHUNK_*.md    — implementation plans for reference"
echo ""
log_info "Next steps:"
echo "  1. Run: npm run dev"
echo "  2. Open browser and test"
echo "  3. Download textures from https://www.solarsystemscope.com/textures/"
echo "  4. Place in public/textures/ per CLAUDE.md file structure"
echo ""
echo "Build finished at: $(date)"
