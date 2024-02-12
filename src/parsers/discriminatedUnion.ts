import {
  Primitive,
  ZodDiscriminatedUnionDef,
  ZodDiscriminatedUnionOption,
} from "zod";
import { Refs } from "../Refs.js";
import { JsonSchema7, JsonSchema7Type, parseDef } from "../parseDef.js";


export type JsonSchema7IfThenElseType = {
  if: JsonSchema7Type;
  then?: JsonSchema7Type;
  else?: JsonSchema7;
};

type JsonSchema7DiscriminatedUnionType = {
  allOf: JsonSchema7IfThenElseType[];
};

export function parseDiscriminatedUnionDef(
  def: ZodDiscriminatedUnionDef<string, any>,
  refs: Refs,
): JsonSchema7DiscriminatedUnionType | undefined {
  const allOf = Array.from(def.optionsMap.entries()).reduce(
    (acc: Array<JsonSchema7IfThenElseType> | undefined, [key, value]) => {
      if (acc === undefined) return undefined;

      const ifThen = asIfThen(def.discriminator, key, value, refs);
      if (ifThen === undefined) return undefined;

      return [...acc, ifThen];
    },
    [],
  );

  if (allOf === undefined || allOf.length === 0) return undefined;

  allOf[allOf.length - 1].else = false;

  return { allOf };
}

function mapPrimitiveValue(
  primitive: Primitive,
): string | number | boolean | undefined {
  switch (typeof primitive) {
    case "number":
    case "string":
    case "boolean":
      return primitive;
    default:
      return undefined;
  }
}

function mapPrimitiveType(
  primitive: Primitive,
): "number" | "string" | "boolean" | "integer" | undefined {
  if (primitive === null) return undefined;

  const primitiveType = typeof primitive;

  switch (primitiveType) {
    case "number":
    case "string":
    case "boolean":
      return primitiveType;
    case "bigint":
      return "integer";
  }
}

function asIfThen(
  discriminator: string,
  option: Primitive,
  def: ZodDiscriminatedUnionOption<any>,
  refs: Refs,
): JsonSchema7IfThenElseType | undefined {
  const ifType = mapPrimitiveType(option);
  const ifValue = mapPrimitiveValue(option);

  if (ifType === undefined || ifValue === undefined) return undefined;

  return {
    if: {
      type: "object",
      properties: { [discriminator]: { type: ifType, const: ifValue } },
      required: [discriminator],
    },
    then: parseDef(def._def, refs),
  };
}
