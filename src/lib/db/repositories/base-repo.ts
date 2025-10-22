// src/lib/db/repositories/base-repo.ts
import { db, type Database } from "../index";
import {
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@/lib/utils/errors";

export abstract class BaseRepository {
  protected db: Database = db;

  protected handleError(error: unknown, context: string): never {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }

    if (error instanceof Error && "code" in error) {
      switch ((error as { code: string }).code) {
        case "23505":
          throw new DatabaseError(
            `${context}: Record already exists`,
            "DUPLICATE_RECORD",
            error
          );
        case "23503":
          throw new DatabaseError(
            `${context}: Referenced record not found`,
            "FOREIGN_KEY_VIOLATION",
            error
          );
        case "23502":
          throw new DatabaseError(
            `${context}: Required field missing`,
            "NOT_NULL_VIOLATION",
            error
          );
      }
    }

    throw new DatabaseError(`${context}: Operation failed`, "UNKNOWN_ERROR", error);
  }

  protected validateExists<T>(entity: T | undefined | null, entityName: string, id: string): T {
    if (!entity) {
      throw new NotFoundError(entityName, id);
    }
    return entity;
  }
}
