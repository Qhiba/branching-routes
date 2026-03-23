# Design System: High-End Branching Narrative Architecture

## 1. Overview & Creative North Star
**Creative North Star: "The Kinetic Blueprint"**

This design system is engineered for the high-stakes world of narrative design, where complexity must be met with absolute clarity. Unlike standard productivity tools that rely on rigid tables and heavy borders, this system treats the interface as a living, breathing canvas—a "Kinetic Blueprint."

We break the "template" look by prioritizing **spatial depth over structural lines**. The UI should feel like a sophisticated head-up display (HUD) projected onto a dark obsidian glass. By using intentional asymmetry in the node layouts and high-contrast typographic scales, we elevate the act of writing into an act of architectural engineering. Every element is designed to feel "lit from within," mirroring the high-tech precision of modern game engines like Unreal or Frostbite.

---

## 2. Colors & Surface Philosophy
The palette is rooted in the "Obsidian" spectrum, using deep, desaturated tones to allow the "Electric" accents to serve as functional signals.

*   **Primary (Electric Blue):** `#a4e6ff` / `#00d1ff`. Used for the "active path" in narratives and primary navigation.
*   **Secondary (Cyber Lime):** `#ffffff` (text) / `#abf900` (accents). Used for success states, completed logic branches, and "Live" status indicators.
*   **Tertiary (Vivid Purple):** `#f6d0ff` / `#eaa9ff`. Used for narrative variables, global constants, and player-choice overrides.

### The "No-Line" Rule
Standard 1px solid borders are strictly prohibited for sectioning. We define boundaries through **Background Tonal Shifts**.
*   A side panel (using `surface_container_low`: `#1c1b1b`) sits against the main workspace (`surface`: `#131313`) without a divider.
*   The transition of color is the boundary. This creates a seamless, "molded" look rather than a "stitched" look.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. We use the **Material Surface Tiers** to define importance:
1.  **Canvas (Base):** `surface` (#131313) – The infinite workspace.
2.  **Navigation/Toolbars:** `surface_container` (#201f1f) – Integrated panels.
3.  **Nodes/Cards:** `surface_container_high` (#2a2a2a) – Floating content.
4.  **Popovers/Modals:** `surface_container_highest` (#353534) – The topmost interaction layer.

### The "Glass & Gradient" Rule
To achieve a premium feel, floating panels (like Inspector windows) must use **Glassmorphism**. Apply a 20px-40px `backdrop-blur` and a semi-transparent `surface_variant` fill.
*   **Signature Texture:** Main CTAs should not be flat. Use a linear gradient from `primary` (#a4e6ff) to `primary_container` (#00d1ff) at a 135-degree angle to give the element a "machined" metallic finish.

---

## 3. Typography
We utilize a dual-typeface system to balance technical precision with editorial authority.

*   **Display & Headlines (Space Grotesk):** This is our "Editorial" voice. Use `display-lg` (3.5rem) and `headline-md` (1.75rem) for major module titles. The wide, geometric character of Space Grotesk feels like high-end tech branding.
*   **Body & Labels (Inter):** This is our "Functional" voice. Inter provides maximum legibility for long-form narrative text.
    *   **Logic Strings:** Use `label-sm` (Inter) for metadata and technical IDs.
    *   **Narrative Text:** Use `body-lg` (Inter) with a generous 1.6 line-height to ensure writers can work for hours without eye strain.

---

## 4. Elevation & Depth
Depth is not an aesthetic choice; it is a functional tool to manage narrative complexity.

*   **Tonal Layering:** Instead of shadows, use "Nested Contrast." A `surface_container_lowest` (#0e0e0e) card placed on a `surface_container_low` (#1c1b1b) background creates a "sunken" effect, perfect for inactive or archived narrative branches.
*   **Ambient Shadows:** For floating "Logic Nodes," use a shadow with a 32px blur, 0px offset, and 6% opacity of the `on_surface` color. This creates an "ambient occlusion" effect rather than a cheap drop-shadow.
*   **The "Ghost Border" Fallback:** If a border is required for node connectivity, use the `outline_variant` (#3c494e) token at **15% opacity**. This "Ghost Border" should be barely visible, acting as a whisper of a container rather than a cage.

---

## 5. Components

### Narrative Nodes (Cards)
*   **Style:** No dividers. Use `surface_container_high` (#2a2a2a).
*   **Rounding:** `md` (0.75rem / 12px).
*   **Header:** Use a `primary_fixed_dim` (#4cd6ff) background for the header area of a node to signify its type (e.g., Dialogue vs. Script).
*   **Spacing:** Use `8` (1.75rem) internal padding to give text breathing room.

### Connection Points (Ports)
*   **Style:** Small circular hits using `secondary` (Cyber Lime) for output and `tertiary` (Vivid Purple) for logic triggers.
*   **Interaction:** On hover, the port should glow with a 10px outer blur of its own color.

### Primary Action Buttons
*   **Style:** `xl` (1.5rem / 24px) roundedness for a pill shape.
*   **State:** Default uses the "Signature Gradient." Hover state increases the `surface_tint` brightness.
*   **Typography:** `label-md` uppercase with 0.05em letter spacing for a "Pro" feel.

### Input Fields
*   **Style:** `surface_container_lowest` fill. No bottom line.
*   **Focus:** A subtle 1px "Ghost Border" in `primary` appears only on focus. Use `body-md` for user entry.

---

## 6. Do's and Don'ts

### Do
*   **DO** use **Asymmetric Layouts** for the Inspector panel. Align technical metadata to the right and narrative content to the left to create a dynamic visual balance.
*   **DO** use **Negative Space** (Spacing Scale `16` or `20`) to separate narrative chapters rather than using horizontal rules.
*   **DO** utilize `surface_bright` (#3a3939) for tooltips to make them pop against the obsidian background.

### Don't
*   **DON'T** use 100% opaque white for text. Use `on_surface_variant` (#bbc9cf) for secondary information to maintain the "Dark Engine" vibe.
*   **DON'T** use standard 4px "Material" rounding. Stick to `md` (12px) or `xl` (24px) to maintain the sophisticated, custom-built look.
*   **DON'T** ever use a pure black (#000000) background. Use `surface_container_lowest` (#0e0e0e) to allow for subtle depth layering.
