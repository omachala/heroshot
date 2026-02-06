import { arrowType } from './arrowType';
import { ellipseType } from './ellipseType';
import { rectType } from './rectType';
import type { AnnotationTypeDefinition } from './types';

const registry = new Map<string, AnnotationTypeDefinition>();

function register(definition: AnnotationTypeDefinition): void {
  registry.set(definition.type, definition);
}

// Register built-in types
register(arrowType);
register(rectType);
register(ellipseType);

/** Get annotation type definition by name */
export function getAnnotationType(type: string): AnnotationTypeDefinition | undefined {
  return registry.get(type);
}

/** Get all registered annotation types */
export function getAllAnnotationTypes(): AnnotationTypeDefinition[] {
  return [...registry.values()];
}
