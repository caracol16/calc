# Design Guidelines: Translation Cost Calculator

## Design Approach
**System-Based Approach**: Material Design principles adapted for professional productivity tool
- Prioritizes clarity, efficiency, and data accuracy
- Form-focused interface with emphasis on usability
- Clean, professional aesthetic suitable for business context

## Core Design Elements

### Typography
- **Primary Font**: Inter or Roboto from Google Fonts
- **Headings**: 
  - H1: text-3xl font-bold (Main calculator title)
  - H2: text-2xl font-semibold (Section headers: "Задание", "Результаты")
  - H3: text-lg font-medium (Subsection labels)
- **Body**: text-base (Form labels, descriptions)
- **Data Display**: text-sm font-mono (Numbers, calculations)
- **Small Text**: text-xs (Helper text, footnotes)

### Layout System
**Spacing Units**: Standardized on 4, 6, 8, 12, 16 (p-4, mb-6, gap-8, py-12, px-16)
- Form sections: p-6 to p-8
- Card spacing: gap-4 between inputs, gap-6 between cards
- Page margins: px-4 md:px-8 lg:px-16
- Vertical rhythm: space-y-6 for major sections, space-y-4 for form groups

### Component Architecture

**Primary Layout**:
- Single-column centered layout (max-w-6xl mx-auto)
- Sticky header with calculator title and export buttons
- Main content area with scrollable task cards
- Summary panel at bottom showing totals

**Form Components**:
- **Task Cards**: White cards with subtle shadow, rounded-lg borders
  - Each task as expandable/collapsible card
  - Task header with language pair selector and remove button
  - Three-column grid for inputs (Новых слов | Повторов | Повторов через файл)
- **Input Fields**: 
  - Number inputs with clear labels above
  - Currency/percentage inputs with appropriate suffixes
  - Grouped logically (word counts together, pricing together)
- **Language Pair Selector**: Dropdown with EN→RU, RU→EN, etc. options
- **Tariff Configuration**: Collapsible section within each task
  - Cost per word input (рублей)
  - Repeat discount percentage
  - Words per day threshold

**Calculation Display**:
- **Results Panel**: Distinct section below inputs
  - Two-column table layout (desktop) / stacked (mobile)
  - Clear visual hierarchy: calculation steps → subtotals → final cost
  - Breakdown sections:
    - Стоимость новых слов
    - Стоимость повторов
    - Итоговая стоимость
    - Расчет сроков
- **Multi-task Summary**: When multiple tasks present
  - Combined totals table
  - Per-task breakdown

**Action Buttons**:
- **Primary Actions**: 
  - "Добавить задание" button (prominent, top-right area)
  - "Экспорт в PDF" and "Экспорт в Excel" (sticky header or bottom)
- **Secondary Actions**: 
  - Remove task (icon button on task card)
  - Reset calculator (subtle text button)

**Data Tables**:
- Striped rows for readability
- Right-aligned numbers
- Bold for totals/final values
- Monospace font for numeric data

### Visual Hierarchy
- **Primary Focus**: Input forms (most visual weight)
- **Secondary Focus**: Calculation results (clear but not competing)
- **Tertiary**: Export options, helper text

### Responsive Behavior
- **Desktop (lg)**: Three-column input grid, side-by-side results
- **Tablet (md)**: Two-column input grid, stacked results
- **Mobile**: Single column throughout, full-width inputs

### Interactive States
- Input focus: Clear border highlight
- Validation: Inline error messages for invalid numbers
- Real-time calculation updates as user types
- Disabled state for export when no data entered

## Images
No hero image needed - this is a utility application. Focus entirely on functional interface elements.

## Key Principles
- **No unnecessary animations** - instant feedback only
- **Calculation transparency** - show all formula steps
- **Error prevention** - clear validation, sensible defaults
- **Professional tone** - suitable for business/agency use
- **Accessibility** - proper labels, keyboard navigation, screen reader support