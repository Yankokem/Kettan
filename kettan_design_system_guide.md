# Kettan Design System Guide (Modern UI Standards)

This guide documents the "Kettan Tan" design language developed for the Kettan platform. All future UI modernization and new feature creation must strictly adhere to these standards to maintain a premium, cohesive, and unified user experience.

---

## 🎨 Core Color Palette (The "Kettan Tan")

The brand identity is anchored in a professional, muted tan and cream palette.

| Role | Hex Code | Usage |
| :--- | :--- | :--- |
| **Primary Accent** | `#8C6B43` | **Kettan Tan.** Active icons, status tracker lines, primary buttons, notification bell, FABs. |
| **Surface (Header/Sidebar)** | `#F0E6D3` | Backgrounds for sidebars, internal card headers, and message bubbles. |
| **Base Workspace** | `#FAF5EF` | Main page background. |
| **Text (Primary)** | `#2E1F0C` | High contrast text for titles and main content. |
| **Text (Secondary)** | `text.secondary` | Muted descriptions and captions. |

### 🚫 Colors & Styles to AVOID
*   **NO Gold**: Do not use bright yellows or "Gold" hex codes (e.g., `#C9A84C`) as primary elements.
*   **NO Muddiness**: Avoid muddy or dark brown gradients that lack professional contrast.
*   **NO Encapsulation**: Do not wrap status trackers or headers in extra boxes/containers with backgrounds unless specified. They should feel integrated into the page.
*   **MANDATORY Icons**: All title headers, main labels, and child labels **must** be accompanied by a relevant icon.

---

## 🏗️ Layout & Containers

The platform uses a layered surface approach to create depth without clutter.

### 1. The Surface Hierarchy
*   **Base Workspace (`#FAF5EF`)**: The lowest layer. All major cards and content sit on this.
*   **Header/Sidebar Surface (`#F0E6D3`)**: Used for navigational elements and contextual headers inside cards.
*   **Action Containers**: Do not wrap functional components (like status trackers or tables) in extra boxes or "encapsulations" unless they require a distinct functional boundary. They should feel integrated into the page's natural flow.

### 2. Border Radius & Spacing
*   **Large Cards**: `14px` border radius.
*   **Small Components**: `2` (8px) for buttons, inputs, and chips.
*   **Spacing**: Use consistent gaps (typically `1.2`, `1.5`, or `2.2` in MUI units) to create breathing room.

---

## ✍️ Typography & Emphasis

Consistency in text sizing and weight is critical for a "premium" feel.

### 1. Text Weight (The "Boldness" Rule)
*   **Be Sparing**: **Do not use bold text so easily.** Excessive bolding creates visual noise and makes nothing stand out.
*   **Primary IDs**: Bold (`800`) is reserved for document IDs (e.g., `#27`).
*   **Section Headers**: Use semi-bold or bold (`600` - `700`) for column headers and section titles.
*   **Body Text**: Always use normal weight (`400` - `500`) for descriptions and data values.

### 2. Document Headers & Page Sections
*   **Gradient Headers**: Use the "Kettan Surface" gradient for main page banners: `linear-gradient(170deg, #F0E6D3 0%, #FAF5EF 100%)`.
*   **Section Title Headers**: 
    *   **Color**: Kettan Brown (`#6B4C2A`).
    *   **Icons**: Must have a leading icon and a vertical accent bar.
    *   **Style**: `fontSize: 14`, `fontWeight: 700`, `display: 'flex'`, `alignItems: 'center'`, `gap: 1`.
*   **Main & Child Labels**:
    *   **Color**: Kettan Tan (`#8C6B43`).
    *   **Icons**: Must have a leading icon (size `13-14px`).
    *   **Style**: `textTransform: 'uppercase'`, `letterSpacing: '0.08em'`, `fontSize: 10.5`.

---

## 🪟 Modals & Dialogs

Modals should feel like an extension of the workspace, not a separate app.

### 1. Geometry & Layout
*   **Border Radius**: Always `14px`.
*   **Header Spacing**: Ensure **EXTREME** breathing room (**`pt: 8` + `mt: 2`** or 80px total) between the dialog header and the first content element. This is a strict requirement for the Kettan aesthetic.
*   **Internal Spacing**: Use `gap: 4` for major vertical sections to prevent crowding.

### 2. Component Usage
*   **Buttons**: **MANDATORY** use of the custom `Button` component (`src/components/UI/Button`). Never use raw MuiButtons in new features.
*   **Inputs**: Standardize on `8px` radius with `BASE_TAN` (`#FAF5EF`) backgrounds for a softer feel.

### 3. Informational Surfaces
*   **Non-Interactive Info**: Use `BASE_TAN` backgrounds. 
*   **Avoid Button-Looks**: Do not use heavy borders, high-contrast shadows, or 'clickable' looking hover states for boxes that only display information (like Tracking Numbers). They should look like "surfaces," not "actions."

---

## 📢 Workflow Status Banners

Use these for **passive wait states** where the user is observing a process or waiting for another party. Do not use small chips for these critical workflow signals.

### 1. Visual Standards
*   **Background**: `alpha(SURFACE_TAN, 0.4)`.
*   **Border**: `1px solid alpha(BRAND_TAN, 0.1)`.
*   **Layout**: Full-width, placed immediately below the header actions but above the main content/stepper.
*   **Radius**: `12px`.

### 2. Content Structure
*   **Icon**: Use a themed icon (Truck, Clock, Check) in a `40x40` rounded box with `alpha(BRAND_TAN, 0.1)` background.
*   **Title**: Short, bold (`fontWeight: 700`), coffee-brown (`#3E2723`).
*   **Description**: Clear, instructional text explaining *why* we are waiting and *what* comes next.

---

*   **Description**:
    *   **Style**: `fontSize: 13`, `color: 'text.secondary'`, `mt: 0.2`.

---

## 📊 Dashboard & Analytics Containers

To maintain a clean and data-focused dashboard, follow these rules for information containers:

### 1. Visual Standards
*   **Background**: Always use white (`#fff`) for main dashboard cards and chart containers to ensure maximum contrast for data.
*   **Descriptions**: **DO NOT** use secondary descriptions or instructional captions below titles. Data should speak for itself.
*   **Icons**:
    *   **Raw Placement**: Do not "encapsulate" or wrap icons in extra boxes, backgrounds, or rounded containers. Place the icon directly next to the title.
    *   **Consistency**: Every major dashboard section (Trends, Distributions, etc.) must have a corresponding "raw" icon to maintain visual rhythm.

---

## 🏷️ Pills vs. Plain Text Status

To maintain a clean UI, we distinguish between high-level and low-level status indicators.

### 1. Global Status (Pills)
*   **Usage**: Only for the **Main Page Status** in the header.
*   **Style**: Use `Chip` (Pills) with a transparent background (`0.12` alpha) and a thin border (`0.28` alpha).
*   **Case**: Always use **Sentence case** (e.g., "In progress"), never all-caps.

### 2. Internal Column Status (Plain Text)
*   **Usage**: For internal table columns (e.g., "Disposition", "Row Status", "Internal State").
*   **Style**: **Do not use pills.** Use straight `Typography` text.
*   **Reason**: Using pills inside every row of a table creates "visual clutter" and makes the table hard to scan. 
*   **Color**: Use the status color (Green, Red, Tan) directly on the text itself.
*   **Weight**: Bold (`700`) is acceptable here to ensure the status is still scannable.

---

## 📊 Data Tables

Tables must be balanced and readable, prioritizing the content over the layout.

### 1. Column Distribution
*   **Units**: Always use **fractional units (fr)** instead of percentages to account for `column-gap`.
*   **Balance**: Lead with a wide "Hero" column (typically `4fr`) and keep data columns compact (`1fr` - `1.4fr`).

### 2. Visual Style
*   **Separators**: Use **dashed** bottom borders (`1px dashed`) for rows.
*   **Header Line**: Use a solid color line below the header with `bgcolor: alpha('#8C6B43', 0.45)` and `height: 2px`.
*   **Header Labels**: Uppercase, `fontSize: 11`, `fontWeight: 700`, `letterSpacing: '0.1em'`.


---

## 🛠️ Global Component Accents

*   **Notification Bell**: Icon color must be `#8C6B43`.
*   **Chat FAB**: Background/Icon must be `#8C6B43`.
*   **Chat Bubbles**: Invert the traditional pattern—Sent messages use `#F0E6D3` (cream-tan) background with dark primary text for a premium feel.
*   **Border Radius**: Standardize on `14px` for cards/containers and `2` (8px) for small components like buttons and inputs.
