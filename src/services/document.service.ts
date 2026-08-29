import { documentRepository, type DocumentFilterOptions } from '@/repositories/document.repository';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import type { Document } from '@/types';
import type { Database } from '@/types/database.types';

type DbDocumentInsert = Database['public']['Tables']['documents']['Insert'];
type DbDocumentUpdate = Database['public']['Tables']['documents']['Update'];

export const documentService = {
  async getDocuments(filters: DocumentFilterOptions): Promise<Document[]> {
    return documentRepository.getDocuments(filters);
  },

  async getDocumentById(id: string): Promise<Document | null> {
    return documentRepository.getById(id);
  },

  async createDocument(payload: DbDocumentInsert, actorUserId?: string): Promise<Document> {
    const doc = await documentRepository.create(payload);

    if (actorUserId) {
      await auditLogRepository.log({
        organization_id: doc.organizationId,
        user_id: actorUserId,
        action: 'document.create',
        entity_type: 'document',
        entity_id: doc.id,
        metadata: { title: doc.title, category: doc.category, sourceType: doc.sourceType },
      });
    }

    return doc;
  },

  async updateDocument(id: string, payload: DbDocumentUpdate, actorUserId?: string): Promise<Document> {
    const doc = await documentRepository.update(id, payload);

    if (actorUserId) {
      await auditLogRepository.log({
        organization_id: doc.organizationId,
        user_id: actorUserId,
        action: 'document.update',
        entity_type: 'document',
        entity_id: doc.id,
        metadata: { updatedFields: Object.keys(payload) },
      });
    }

    return doc;
  },

  async deleteDocument(id: string, organizationId: string, actorUserId?: string): Promise<void> {
    await documentRepository.delete(id, organizationId);

    if (actorUserId) {
      await auditLogRepository.log({
        organization_id: organizationId,
        user_id: actorUserId,
        action: 'document.delete',
        entity_type: 'document',
        entity_id: id,
        metadata: {},
      });
    }
  },
};
