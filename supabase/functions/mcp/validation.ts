type Schema = {
  type?: string | string[];
  enum?: readonly unknown[];
  properties?: Record<string, Schema | undefined>;
  required?: readonly string[];
  additionalProperties?: boolean;
  items?: Schema;
  minimum?: number;
  maximum?: number;
  maxLength?: number;
};

/** Validate the same JSON Schema advertised to clients, before touching the database. */
export function validateArguments(
  schema: Schema,
  value: unknown,
  path = "arguments",
): void {
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  const actual =
    value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
  if (
    !types.some(
      (type) =>
        type === actual ||
        (type === "integer" &&
          typeof value === "number" &&
          Number.isInteger(value)),
    )
  )
    throw new Error(`${path} must be ${types.join(" or ")}`);
  if (schema.enum && !schema.enum.includes(value))
    throw new Error(`${path} has an unsupported value`);
  if (
    typeof value === "number" &&
    (!Number.isFinite(value) ||
      (schema.minimum !== undefined && value < schema.minimum) ||
      (schema.maximum !== undefined && value > schema.maximum))
  )
    throw new Error(`${path} is out of range`);
  if (typeof value === "string" && value.length > (schema.maxLength ?? 20000))
    throw new Error(`${path} is too long`);
  if (Array.isArray(value)) {
    if (value.length > 200) throw new Error(`${path} has too many items`);
    if (schema.items)
      value.forEach((item, i) =>
        validateArguments(schema.items!, item, `${path}[${i}]`),
      );
  } else if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    for (const key of schema.required ?? [])
      if (!(key in object)) throw new Error(`${path}.${key} is required`);
    for (const [key, item] of Object.entries(object)) {
      const property = schema.properties?.[key];
      if (property) validateArguments(property, item, `${path}.${key}`);
      else if (schema.additionalProperties === false)
        throw new Error(`${path}.${key} is not supported`);
      if (
        typeof item === "string" &&
        (key.endsWith("_id") || key === "project_id") &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          item,
        )
      )
        throw new Error(`${key} must be a UUID`);
      if (
        typeof item === "string" &&
        ["title", "body", "name", "chain"].includes(key) &&
        !item.trim()
      )
        throw new Error(`${key} cannot be empty`);
      if (
        key === "due_date" &&
        item !== null &&
        (typeof item !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(item) ||
          !Number.isFinite(Date.parse(item)) ||
          new Date(item).toISOString().slice(0, 10) !== item)
      )
        throw new Error("due_date must be a valid YYYY-MM-DD date");
    }
  }
}
