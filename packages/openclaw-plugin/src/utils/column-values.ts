/**
 * Column value formatting helpers for all monday.com column types.
 *
 * monday.com columns store values as JSON strings with type-specific formats.
 * This module provides helpers to build the correct JSON for each column type
 * when creating or updating items via the API.
 *
 * Usage: Build a column_values object, then pass it to create/update mutations.
 */

export type ColumnValueInput = Record<string, any>;

/** Build column_values JSON string for API mutations */
export function formatColumnValues(
  columns: Record<string, any>
): string {
  return JSON.stringify(columns);
}

// --- Individual column type formatters ---

/** Status column: { "label": "Done" } or { "index": 1 } */
export function statusValue(labelOrIndex: string | number): ColumnValueInput {
  if (typeof labelOrIndex === "number") {
    return { index: labelOrIndex };
  }
  return { label: labelOrIndex };
}

/** Text column: just a string */
export function textValue(text: string): string {
  return text;
}

/** Number column: just a number */
export function numberValue(num: number): number {
  return num;
}

/** Date column: { "date": "2024-01-15", "time": "09:00:00" } */
export function dateValue(
  date: string,
  time?: string
): ColumnValueInput {
  const val: ColumnValueInput = { date };
  if (time) val.time = time;
  return val;
}

/** Timeline column: { "from": "2024-01-01", "to": "2024-01-31" } */
export function timelineValue(from: string, to: string): ColumnValueInput {
  return { from, to };
}

/** Person column: { "personsAndTeams": [{ "id": 123, "kind": "person" }] } */
export function personValue(
  personsAndTeams: Array<{ id: number; kind: "person" | "team" }>
): ColumnValueInput {
  return { personsAndTeams };
}

/** Dropdown column: { "labels": ["Option 1", "Option 2"] } */
export function dropdownValue(labels: string[]): ColumnValueInput {
  return { labels };
}

/** Checkbox column: { "checked": true } */
export function checkboxValue(checked: boolean): ColumnValueInput {
  return { checked: checked ? "true" : "false" };
}

/** Email column: { "email": "a@b.com", "text": "display text" } */
export function emailValue(email: string, text?: string): ColumnValueInput {
  return { email, text: text ?? email };
}

/** Phone column: { "phone": "+1234567890", "countryShortName": "US" } */
export function phoneValue(
  phone: string,
  countryShortName: string
): ColumnValueInput {
  return { phone, countryShortName };
}

/** Link column: { "url": "https://...", "text": "display text" } */
export function linkValue(url: string, text?: string): ColumnValueInput {
  return { url, text: text ?? url };
}

/** Long text column: { "text": "long content here" } */
export function longTextValue(text: string): ColumnValueInput {
  return { text };
}

/** Rating column: { "rating": 4 } (1-5) */
export function ratingValue(rating: number): ColumnValueInput {
  return { rating: Math.max(1, Math.min(5, Math.round(rating))) };
}

/** Hour column: { "hour": 14, "minute": 30 } */
export function hourValue(hour: number, minute = 0): ColumnValueInput {
  return { hour, minute };
}

/** Week column: { "week": { "startDate": "2024-01-15", "endDate": "2024-01-21" } } */
export function weekValue(startDate: string, endDate: string): ColumnValueInput {
  return { week: { startDate, endDate } };
}

/** World clock / timezone column: { "timezone": "America/New_York" } */
export function timezoneValue(timezone: string): ColumnValueInput {
  return { timezone };
}

/** Location column: { "lat": 40.7128, "lng": -74.0060, "address": "New York, NY" } */
export function locationValue(
  lat: number,
  lng: number,
  address?: string
): ColumnValueInput {
  const val: ColumnValueInput = { lat, lng };
  if (address) val.address = address;
  return val;
}

/** Country column: { "countryCode": "US", "countryName": "United States" } */
export function countryValue(
  countryCode: string,
  countryName: string
): ColumnValueInput {
  return { countryCode, countryName };
}

/** Tags column: { "tag_ids": [123, 456] } */
export function tagsValue(tagIds: number[]): ColumnValueInput {
  return { tag_ids: tagIds };
}

/** Color picker column: { "color": "#FF5733" } */
export function colorValue(color: string): ColumnValueInput {
  return { color };
}

/** File column — files must be uploaded separately, then referenced */
export function fileValue(fileUrls: string[]): ColumnValueInput {
  return { files: fileUrls.map((url) => ({ url })) };
}

/**
 * Parse a column value from the API response.
 * Column values come back as JSON strings in the `value` field.
 */
export function parseColumnValue(rawValue: string | null): any {
  if (!rawValue) return null;
  try {
    return JSON.parse(rawValue);
  } catch {
    return rawValue;
  }
}

/**
 * Map of column type IDs to their human-readable names.
 */
export const COLUMN_TYPES: Record<string, string> = {
  auto_number: "Auto Number",
  board_relation: "Board Relation",
  button: "Button",
  checkbox: "Checkbox",
  color_picker: "Color Picker",
  country: "Country",
  creation_log: "Creation Log",
  date: "Date",
  dependency: "Dependency",
  doc: "Doc",
  dropdown: "Dropdown",
  email: "Email",
  file: "File",
  formula: "Formula",
  hour: "Hour",
  item_id: "Item ID",
  last_updated: "Last Updated",
  link: "Link",
  location: "Location",
  long_text: "Long Text",
  mirror: "Mirror",
  name: "Name",
  numbers: "Numbers",
  people: "People",
  phone: "Phone",
  progress: "Progress Tracking",
  rating: "Rating",
  status: "Status",
  tags: "Tags",
  text: "Text",
  timeline: "Timeline",
  time_tracking: "Time Tracking",
  vote: "Vote",
  week: "Week",
  world_clock: "World Clock",
};
