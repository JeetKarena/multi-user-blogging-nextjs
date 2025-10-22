// src/lib/services/draft-service.ts
import { DraftRepository } from "@/lib/db/repositories/draft-repo";
import { AuthorizationError, NotFoundError } from "@/lib/utils/errors";
import { Draft, CreateDraftInput, UpdateDraftInput } from "@/lib/db/models/draft";

export class DraftService {
  private draftRepo = new DraftRepository();

  async getAllByAuthorId(authorId: string, limit = 10): Promise<Draft[]> {
    return await this.draftRepo.findByAuthorId(authorId, limit);
  }

  async getById(id: string): Promise<Draft | null> {
    return await this.draftRepo.findById(id);
  }

  async create(data: CreateDraftInput, authorId: string): Promise<Draft> {
    return await this.draftRepo.create({ ...data, authorId });
  }

  async update(id: string, data: UpdateDraftInput, authorId: string): Promise<Draft | null> {
    // Check if draft exists
    const draft = await this.draftRepo.findById(id);
    if (!draft) {
      throw new NotFoundError("Draft not found");
    }

    // Check if user owns the draft
    if (draft.authorId !== authorId) {
      throw new AuthorizationError("You don't have permission to update this draft");
    }

    return await this.draftRepo.update(id, data);
  }

  async delete(id: string, authorId: string): Promise<boolean> {
    // Check if draft exists
    const draft = await this.draftRepo.findById(id);
    if (!draft) {
      throw new NotFoundError("Draft not found");
    }

    // Check if user owns the draft
    if (draft.authorId !== authorId) {
      throw new AuthorizationError("You don't have permission to delete this draft");
    }

    return await this.draftRepo.delete(id);
  }

  async countByAuthorId(authorId: string): Promise<number> {
    return await this.draftRepo.countByAuthorId(authorId);
  }

  async convertToPost(draftId: string, authorId: string): Promise<Draft> {
    // Get the draft
    const draft = await this.draftRepo.findById(draftId);
    if (!draft) {
      throw new NotFoundError("Draft not found");
    }

    // Check if user owns the draft
    if (draft.authorId !== authorId) {
      throw new AuthorizationError("You don't have permission to convert this draft");
    }

    // Update the draft with current timestamp (marking it as "converted")
    // In a real implementation, you might want to move this to posts table
    // For now, we'll just update the updatedAt timestamp
    const updatedDraft = await this.draftRepo.update(draftId, {});
    if (!updatedDraft) {
      throw new Error("Failed to update draft");
    }
    return updatedDraft;
  }
}