/** Explicit column lists, so a future column never leaks into responses by accident. */
export const PROFILE_COLUMNS = "id, email, full_name, role, is_active, updated_at";
export const MENU_ITEM_COLUMNS =
  "id, name, description, category, price, image_url, is_available, is_archived, created_at, updated_at";
export const TABLE_COLUMNS = "id, table_number, capacity, location, status, created_at, updated_at";
export const INGREDIENT_COLUMNS = "id, name, unit, minimum_threshold, shelf_life_days, created_at";
export const BATCH_COLUMNS =
    "id, ingredient_id, batch_number, quantity, expiration_date, received_date, status, created_at";
export const LOG_COLUMNS =
  "id, batch_id, ingredient_name, batch_number, unit, change_type, quantity_changed, user_id, user_name, created_at";

/** Supabase's untyped client returns loosely typed rows; this makes the intent explicit. */
export function cast<T>(value: unknown): T {
  return value as T;
}
export const PENCIL_BOOKING_COLUMNS =
  "id, guest_name, guest_email, guest_phone, party_size, booking_date, booking_time, status, special_requests, staff_notes, handled_by, created_at, updated_at";