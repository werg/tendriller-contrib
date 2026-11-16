---
id: "localize-an-interaction"
title: "Localize language, numbers, and direction coherently"
summary: "Keep language, locale, time zone, source values, plural messages, and bidirectional layout consistent without losing drafts or changing meaning."
group: "Design everyday interactions"
tags: ["localization", "formatting", "accessibility"]
choices: ["Language, formatting locale, and time zone as separate choices", "Canonical source values versus localized display and input", "Reviewed translations, fallback messages, and direction"]
capabilities: []
evidence: "explained"
related: ["build-correctable-forms", "complete-accessible-interactions", "adapt-without-losing-work", "choose-data-model"]
sources: ["https://github.com/werg/tendriller/blob/62f15021e77812e58533aa816cd24698aa70cfc8/docs/BROWSER_API.md", "https://github.com/werg/tendriller/blob/62f15021e77812e58533aa816cd24698aa70cfc8/docs/CAPTURES.md"]
---

# Localize language, numbers, and direction coherently

Use this when a page serves people with different languages, number/date conventions, or writing directions. An equipment request may be written in Arabic, contain a Latin part number, show a German-formatted measurement, and use a delivery date in another time zone. Changing labels alone will not make that request coherent.

Begin with the actual audience and task. A single clearly supported language with an honest translation boundary may be better than a large menu of unreviewed strings. Decide which languages and formats the complete journey supports, including validation, status, recovery, notifications, and exported reports.

## Separate preferences that answer different questions

| Choice | What it controls | What it must not silently decide |
| --- | --- | --- |
| Interface language | Labels, explanations, and messages. | The person's location or legal identity. |
| Formatting locale | Number, date, sorting, and plural conventions. | The underlying value or unit. |
| Time zone | How instants and scheduled local times are interpreted. | The language of the interface. |
| Text direction | Layout and ordering of directional content. | Translation or reading ability. |
| Measurement units | Display/input unit and explicit conversion. | Source measurement provenance. |

Offer sensible initial choices from available context, but make consequential ones visible and correctable. A browser language is not proof of the time zone for an event or a preferred measurement unit. Store preferences separately from domain data, and define whether they apply to the device, person, or shared report.

For a delivery request, show the language choice, format example, and relevant time zone where the person reviews a date/time. Switching the interface language should not change the scheduled instant or reinterpret a previously accepted amount.

## Keep source meaning stable

Store numbers and units in an explicit application representation, not solely as rendered strings. Preserve original input text while it is a draft, especially when parsing is ambiguous. The string `1,234` can mean different things under different conventions; show the interpreted value and unit before accepting a consequential ambiguity.

Identifiers such as part numbers and postal codes are not quantities. Preserve leading zeros and meaningful punctuation rather than formatting them as numbers. Distinguish a calendar date from an instant: a date-only field should not acquire a midnight UTC conversion that changes its visible day elsewhere.

The [ECMAScript internationalization specification](https://tc39.es/ecma402/) defines locale-sensitive services including `Intl.NumberFormat`, `Intl.DateTimeFormat`, `Intl.PluralRules`, and `Intl.Collator`. Use the relevant formatter with an explicit chosen context where consistency matters. Formatting services do not decide the application's unit conversions or ambiguous-input policy. A locale-aware display does not make a generic numeric parser locale-aware.

For measurements, retain source value/unit and any conversion policy. Rounding for display must not silently replace the source precision. Exports should identify their format and locale, or use an unambiguous machine-readable representation with separate display labels. A reviewer must be able to tell whether “03/04” is a date, and which convention was intended.

## Translate complete messages and states

Keep translatable messages keyed by stable semantic IDs, with named parameters and context for translators. Compose complete sentences through a message system rather than concatenating fragments whose order assumes one language. Choose plural variants from the locale's rules; a simple singular/other English shortcut is not a universal message model.

Include errors, queued/accepted/rejected status, empty states, permission explanations, and accessible names. A translated main screen that falls back to opaque technical exceptions during failure does not support the complete task. Keep code identifiers and raw diagnostics in a separate expandable technical detail where useful.

Decide a fallback chain and label a missing or unreviewed translation honestly. Never render a blank action or an internal key in place of critical instructions. If a changed policy or approval statement lacks a reviewed translation, show the available source wording and require an appropriate review path rather than presenting an old translation as current. Preserve the original language for quotes and evidence; a translation is a derived interpretation with its own provenance.

## Handle direction at the content boundary

Set the document language and direction deliberately. W3C's [structural direction guidance](https://www.w3.org/International/questions/qa-html-dir) explains use of HTML `dir`, direction-aware layout, and `dir="auto"` for content whose direction is unknown. Use logical start/end spacing and alignment where appropriate instead of mirroring every physical left/right detail.

Mixed content needs particular care: a Latin item ID inside an Arabic sentence, punctuation beside a URL, or a person's name at the start of a message. Use a suitable isolated text boundary such as `bdi` or an explicit known direction. Automatic direction is a heuristic, not language detection; preserve a deliberate override when the first strong character gives the wrong result.

Do not mirror diagrams, instrument readings, brand marks, or physical orientation instructions unless their meaning calls for it. “Left side of the device” is a domain direction, not a layout preference. Test the actual mixed-script labels and numbers expected in the task, not only translated placeholder paragraphs.

## Change preferences without losing work

Treat a language switch as a view update, preserving field identity, current draft strings, selection, scroll context, and focus. Translate the surrounding labels immediately if possible, but do not reinterpret partially typed data under a new format without review. Show a choice to keep or explicitly convert a draft representation when that matters.

Pending submissions retain their original source values, request identity, and task context. A late acceptance or rejection should use the current interface language while still identifying the original submitted snapshot. Do not repeat a command because its status message was retranslated. The [continuity guide](../adapt-without-losing-work/COOKBOOK.md) and [correctable forms](../build-correctable-forms/COOKBOOK.md) cover those boundaries.

For shared views, choose whether each person sees local formatting or the report fixes a single presentation. An export may need both canonical data and a declared presentation context. A translated report should record the source report version, translation language/version, and any unresolved terms when that distinction is consequential.

## Verify the real interaction

Use long translations, narrow screens, zoom, non-Latin digits where supported, right-to-left text with embedded IDs, and different plural counts. Keep action labels and error summaries readable without clipping. Test keyboard focus order and screen-reader language changes where applicable; the visual order alone is not sufficient.

| Scenario | Expected observation |
| --- | --- |
| Switch language during a partially completed form | Drafts and focus survive; values are not silently reinterpreted. |
| Enter an ambiguous number/date | The expected convention and parsed meaning are reviewable. |
| Change display time zone after submission | The same instant remains identifiable. |
| Missing critical translation | A readable, explicit fallback appears with a valid next action. |
| Mix RTL text, Latin identifiers, and punctuation | Each segment remains readable and correctly associated. |
| Export then re-import | Source values, units, and date semantics survive the declared format. |

Record reviewed languages, locales, input assumptions, and tested device/assistive-technology conditions. This explained guide does not claim that every translation or locale has been validated.
