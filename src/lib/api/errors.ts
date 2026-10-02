/** The only HTTP error statuses this API emits. */
export type ApiErrorStatus = 400 | 401 | 403 | 404 | 500;

/** Throw from anywhere in a route; `withApi` turns it into the standard error envelope. */
export class ApiError extends Error {
  constructor(public readonly status: ApiErrorStatus, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

interface PgLikeError {
  code?: string;
  message: string;
}

// Friendly messages for named constraints (see 001_schema.sql).
const UNIQUE_MESSAGES: Record<string, string> = {
  tables_table_number_key: "A table with that table_number already exists.",
  ingredients_name_key: "An ingredient with that name already exists.",
};

interface AuthLikeError {
  code?: string;
  message: string;
}

/** Translate a Supabase Auth (admin API) error into an ApiError. */
export function mapAuthError(error: AuthLikeError): ApiError {
  switch (error.code) {
    case "email_exists":
    case "user_already_exists":
      return new ApiError(400, "A user with that email already exists.");
    case "weak_password":
      return new ApiError(400, error.message); // tells the admin which rule failed
    case "validation_failed":
    case "email_address_invalid":
      return new ApiError(400, "The email or password is not valid.");
    case "user_not_found":
      return new ApiError(404, "User not found.");
    default:
      console.error("[api] unexpected auth admin error:", error);
      return new ApiError(500, "Internal server error.");
  }
}

/** Translate a Supabase/PostgREST/Postgres error into an ApiError. */
export function mapSupabaseError(error: PgLikeError): ApiError {
  switch (error.code) {
    case "PGRST116": // .single() matched zero rows
      return new ApiError(404, "Not found.");
    case "23505": { // unique_violation
      const key = Object.keys(UNIQUE_MESSAGES).find((k) => error.message.includes(k));
      return new ApiError(400, key ? UNIQUE_MESSAGES[key] : "A record with that value already exists.");
    }
    case "23503": // foreign_key_violation (e.g. unknown ingredient_id / table_id)
      return new ApiError(400, "A referenced record does not exist.");
    case "23502": // not_null_violation
    case "23514": // check_violation
    case "22P02": // invalid_text_representation
    case "22003": // numeric_value_out_of_range
      return new ApiError(400, "The submitted values violate a database constraint.");
    case "42501": // insufficient_privilege (RLS, or the guard triggers in 002_rls.sql)
      return new ApiError(403, "You do not have permission to perform this action.");
    default:
      console.error("[api] unexpected database error:", error);
      return new ApiError(500, "Internal server error.");
  }
}
