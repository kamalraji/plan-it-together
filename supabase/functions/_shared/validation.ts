import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ============= Custom Error Map (Production Safety) =============

/**
 * Custom error map for production-safe messages
 * Prevents internal structure exposure while remaining helpful
 */
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  // Generic message for type errors
  if (issue.code === z.ZodIssueCode.invalid_type) {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'value';
    return { message: `Invalid ${path}` };
  }

  // Strict mode violations
  if (issue.code === z.ZodIssueCode.unrecognized_keys) {
    return { message: "Request contains unexpected fields" };
  }

  // Size/length constraints
  if (issue.code === z.ZodIssueCode.too_big) {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'value';
    if (issue.type === "string") {
      return { message: `${path} exceeds maximum length` };
    }
    if (issue.type === "array") {
      return { message: `${path} has too many items` };
    }
    if (issue.type === "number") {
      return { message: `${path} exceeds maximum value` };
    }
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'value';
    if (issue.type === "string" && issue.minimum === 1) {
      return { message: `${path} is required` };
    }
  }

  // Default to context message
  return { message: ctx.defaultError };
};

// Set custom error map globally
z.setErrorMap(customErrorMap);

// ============= Body Size Limits =============

/**
 * Body size limits by function type for DoS protection
 */
export const BODY_SIZE_LIMITS = {
  small: 10 * 1024,      // 10KB - simple actions, QR codes
  medium: 100 * 1024,    // 100KB - standard requests (default)
  large: 1024 * 1024,    // 1MB - file metadata, certificates, batch ops
} as const;

export type BodySizeLimit = keyof typeof BODY_SIZE_LIMITS;

// ============= Common Field Validators =============

// UUID validation
export const uuidSchema = z
  .string()
  .uuid("Invalid UUID format")
  .describe("A valid UUID v4 identifier");

// Optional UUID
export const optionalUuidSchema = z
  .string()
  .uuid("Invalid UUID format")
  .optional()
  .nullable()
  .describe("An optional UUID v4 identifier");

// Email validation
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .max(255, "Email too long")
  .describe("A valid email address (max 255 chars)");

// Optional email
export const optionalEmailSchema = z
  .string()
  .email("Invalid email format")
  .max(255, "Email too long")
  .optional()
  .nullable()
  .describe("An optional email address");

// URL validation
export const urlSchema = z
  .string()
  .url("Invalid URL format")
  .max(2048, "URL too long")
  .describe("A valid URL (max 2048 chars)");

export const optionalUrlSchema = z
  .string()
  .url("Invalid URL format")
  .max(2048, "URL too long")
  .optional()
  .nullable()
  .describe("An optional URL");

// Hex color validation
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format (e.g., #1a365d)")
  .describe("A valid hex color code (e.g., #1a365d)");

// Phone validation
export const phoneSchema = z
  .string()
  .regex(/^[\d\s()+-]{7,20}$/, "Invalid phone number format")
  .optional()
  .nullable()
  .describe("A phone number (7-20 digits with optional formatting)");

// Slug validation
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Slug must be at least 3 characters")
  .max(100, "Slug must be less than 100 characters")
  .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
  .describe("A URL-safe slug (lowercase letters, numbers, hyphens)");

// ============= String Length Constraints =============

// Short string (1-100 chars)
export const shortStringSchema = z
  .string()
  .trim()
  .min(1, "Field cannot be empty")
  .max(100, "Maximum 100 characters")
  .describe("A short text field (1-100 characters)");

// Medium string (1-500 chars)
export const mediumStringSchema = z
  .string()
  .trim()
  .min(1, "Field cannot be empty")
  .max(500, "Maximum 500 characters")
  .describe("A medium text field (1-500 characters)");

// Long string (1-2000 chars)
export const longStringSchema = z
  .string()
  .trim()
  .min(1, "Field cannot be empty")
  .max(2000, "Maximum 2000 characters")
  .describe("A long text field (1-2000 characters)");

// Optional variants
export const optionalShortStringSchema = z
  .string()
  .trim()
  .max(100, "Maximum 100 characters")
  .optional()
  .nullable()
  .describe("An optional short text field");

export const optionalMediumStringSchema = z
  .string()
  .trim()
  .max(500, "Maximum 500 characters")
  .optional()
  .nullable()
  .describe("An optional medium text field");

export const optionalLongStringSchema = z
  .string()
  .trim()
  .max(2000, "Maximum 2000 characters")
  .optional()
  .nullable()
  .describe("An optional long text field");

// ============= Coercion Schemas (Query Parameters) =============

/**
 * Coerces string to number (useful for query params)
 */
export const coercedNumberSchema = z.coerce
  .number()
  .describe("A number (can be passed as string)");

/**
 * Coerces string to boolean (useful for query params)
 */
export const coercedBooleanSchema = z.coerce
  .boolean()
  .describe("A boolean (can be passed as string)");

/**
 * Coerces string to Date (useful for query params)
 */
export const coercedDateSchema = z.coerce
  .date()
  .describe("A date (can be passed as ISO string)");

/**
 * Common pagination schema for list endpoints
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe("Page number (1-indexed)"),
  limit: z.coerce.number().int().min(1).max(100).default(20).describe("Items per page (max 100)"),
  offset: z.coerce.number().int().min(0).optional().describe("Number of items to skip"),
}).strict();

// ============= Bounded Schemas (Depth/Size Limits) =============

/**
 * Safe JSON primitive (bounded)
 */
const jsonPrimitiveSchema = z.union([
  z.string().max(10000),
  z.number(),
  z.boolean(),
  z.null(),
]);

/**
 * Bounded JSON object schema (max 3 levels, max 50 properties per level)
 * Use this for metadata/details fields to prevent memory exhaustion
 */
export const boundedJsonSchema = z.record(
  z.string().max(100), // key length limit
  z.union([
    jsonPrimitiveSchema,
    z.array(jsonPrimitiveSchema).max(100),
    z.record(
      z.string().max(100),
      z.union([
        jsonPrimitiveSchema,
        z.array(jsonPrimitiveSchema).max(50),
        z.record(z.string().max(100), jsonPrimitiveSchema).refine(
          (obj) => Object.keys(obj).length <= 30,
          "Nested object has too many properties"
        ),
      ])
    ).refine(
      (obj) => Object.keys(obj).length <= 50,
      "Object has too many properties"
    ),
  ])
).refine(
  (obj) => Object.keys(obj).length <= 50,
  "Object has too many properties"
).optional().nullable().describe("A bounded JSON object (max 3 levels deep, max 50 properties)");

/**
 * Helper to create a bounded array schema
 */
export function boundedArray<T extends z.ZodType>(
  schema: T,
  maxItems: number = 100
) {
  return z.array(schema).max(maxItems, `Array exceeds maximum of ${maxItems} items`);
}

// ============= Password Validation =============

/**
 * Strong password validation schema
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be less than 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
  .describe("A strong password meeting security requirements");

/**
 * Password with confirmation schema
 */
export const passwordConfirmSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).strict().refine(
  (data) => data.password === data.confirmPassword,
  { message: "Passwords do not match", path: ["confirmPassword"] }
);

// ============= Common Enums =============

// App roles - Core authentication roles only
// Note: judge, speaker, volunteer roles are handled by workspace role hierarchy
export const appRoleSchema = z
  .enum(["admin", "organizer", "participant"])
  .describe("User application role (core authentication only)");

// Organization category (matches database enum)
export const organizationCategorySchema = z.enum([
  "COLLEGE",
  "COMPANY",
  "INDUSTRY",
  "NON_PROFIT",
]).describe("Organization category type");

// Workspace roles - Complete 4-level hierarchy (35 roles)
export const workspaceRoleSchema = z.enum([
  // Level 1 - Workspace Owner
  "WORKSPACE_OWNER",
  
  // Level 2 - Department Managers
  "OPERATIONS_MANAGER",
  "GROWTH_MANAGER",
  "CONTENT_MANAGER",
  "TECH_FINANCE_MANAGER",
  "VOLUNTEERS_MANAGER",
  
  // Level 3 - Team Leads (Committee Leads)
  "EVENT_LEAD",
  "CATERING_LEAD",
  "LOGISTICS_LEAD",
  "FACILITY_LEAD",
  "MARKETING_LEAD",
  "COMMUNICATION_LEAD",
  "SPONSORSHIP_LEAD",
  "SOCIAL_MEDIA_LEAD",
  "CONTENT_LEAD",
  "SPEAKER_LIAISON_LEAD",
  "JUDGE_LEAD",
  "MEDIA_LEAD",
  "FINANCE_LEAD",
  "REGISTRATION_LEAD",
  "TECHNICAL_LEAD",
  "IT_LEAD",
  "VOLUNTEERS_LEAD",
  
  // Level 4 - Coordinators
  "EVENT_COORDINATOR",
  "CATERING_COORDINATOR",
  "LOGISTICS_COORDINATOR",
  "FACILITY_COORDINATOR",
  "MARKETING_COORDINATOR",
  "COMMUNICATION_COORDINATOR",
  "SPONSORSHIP_COORDINATOR",
  "SOCIAL_MEDIA_COORDINATOR",
  "CONTENT_COORDINATOR",
  "SPEAKER_LIAISON_COORDINATOR",
  "JUDGE_COORDINATOR",
  "MEDIA_COORDINATOR",
  "FINANCE_COORDINATOR",
  "REGISTRATION_COORDINATOR",
  "TECHNICAL_COORDINATOR",
  "IT_COORDINATOR",
  "VOLUNTEER_COORDINATOR",
]).describe("Workspace team member role (4-level hierarchy)");

// Helper schemas for role-level validation
export const managerRoleSchema = z.enum([
  "OPERATIONS_MANAGER",
  "GROWTH_MANAGER",
  "CONTENT_MANAGER",
  "TECH_FINANCE_MANAGER",
  "VOLUNTEERS_MANAGER",
]).describe("Department manager role");

export const leadRoleSchema = z.enum([
  "EVENT_LEAD",
  "CATERING_LEAD",
  "LOGISTICS_LEAD",
  "FACILITY_LEAD",
  "MARKETING_LEAD",
  "COMMUNICATION_LEAD",
  "SPONSORSHIP_LEAD",
  "SOCIAL_MEDIA_LEAD",
  "CONTENT_LEAD",
  "SPEAKER_LIAISON_LEAD",
  "JUDGE_LEAD",
  "MEDIA_LEAD",
  "FINANCE_LEAD",
  "REGISTRATION_LEAD",
  "TECHNICAL_LEAD",
  "IT_LEAD",
  "VOLUNTEERS_LEAD",
]).describe("Committee lead role");

export const coordinatorRoleSchema = z.enum([
  "EVENT_COORDINATOR",
  "CATERING_COORDINATOR",
  "LOGISTICS_COORDINATOR",
  "FACILITY_COORDINATOR",
  "MARKETING_COORDINATOR",
  "COMMUNICATION_COORDINATOR",
  "SPONSORSHIP_COORDINATOR",
  "SOCIAL_MEDIA_COORDINATOR",
  "CONTENT_COORDINATOR",
  "SPEAKER_LIAISON_COORDINATOR",
  "JUDGE_COORDINATOR",
  "MEDIA_COORDINATOR",
  "FINANCE_COORDINATOR",
  "REGISTRATION_COORDINATOR",
  "TECHNICAL_COORDINATOR",
  "IT_COORDINATOR",
  "VOLUNTEER_COORDINATOR",
]).describe("Task coordinator role");

// Notification types
export const notificationTypeSchema = z.enum([
  "broadcast",
  "task_assignment",
  "deadline_reminder",
  "channel_message",
]).describe("Notification type");

// Certificate types
export const certificateTypeSchema = z.enum([
  "Completion",
  "Achievement",
  "Participation",
  "Excellence",
  "Appreciation",
]).describe("Certificate type");

// Design styles
export const designStyleSchema = z.enum([
  "elegant",
  "modern",
  "corporate",
  "creative",
  "academic",
]).describe("Design style");

// Vendor status
export const vendorStatusSchema = z.enum([
  "PENDING",
  "VERIFIED",
  "REJECTED",
  "SUSPENDED",
]).describe("Vendor verification status");

// Social platforms
export const socialPlatformSchema = z.enum([
  "twitter",
  "linkedin",
  "instagram",
]).describe("Social media platform");

// ============= Helper Functions =============

/**
 * Creates a standardized validation error response
 */
export function validationError(
  error: z.ZodError,
  corsHeaders: Record<string, string>
): Response {
  const messages = error.errors
    .map((e) => (e.path.length > 0 ? `${e.path.join(".")}: ${e.message}` : e.message))
    .join(", ");

  console.log(`[VALIDATION_FAIL] ${messages}`);

  return new Response(JSON.stringify({ error: messages }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Options for parseAndValidate
 */
export interface ParseAndValidateOptions {
  /** Maximum body size limit (defaults to 'medium' = 100KB) */
  maxBodySize?: BodySizeLimit;
}

/**
 * Safely parses request body and validates against a schema
 * Includes body size validation for DoS protection
 */
export async function parseAndValidate<T extends z.ZodType>(
  req: Request,
  schema: T,
  corsHeaders: Record<string, string>,
  options: ParseAndValidateOptions = {}
): Promise<{ success: true; data: z.infer<T> } | { success: false; response: Response }> {
  try {
    // Check body size limit
    const maxSize = BODY_SIZE_LIMITS[options.maxBodySize ?? 'medium'];
    const contentLength = req.headers.get("content-length");

    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (!isNaN(size) && size > maxSize) {
        console.warn(`[VALIDATION_FAIL] Body size ${size} exceeds limit ${maxSize}`);
        return {
          success: false,
          response: new Response(
            JSON.stringify({ error: "Request body too large" }),
            { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          ),
        };
      }
    }

    const rawBody = await req.json();
    const result = schema.safeParse(rawBody);

    if (!result.success) {
      return { success: false, response: validationError(result.error, corsHeaders) };
    }

    return { success: true, data: result.data };
  } catch {
    return {
      success: false,
      response: new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }
}

/**
 * Parses URL query parameters against a schema
 */
export function parseQueryParams<T extends z.ZodType>(
  url: URL,
  schema: T
): z.SafeParseReturnType<z.input<T>, z.output<T>> {
  const params = Object.fromEntries(url.searchParams.entries());
  return schema.safeParse(params);
}

// Re-export z for convenience
export { z };
