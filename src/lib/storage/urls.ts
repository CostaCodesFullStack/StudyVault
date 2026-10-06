/** Rota autenticada que serve o PDF; recebe o ID do documento, nunca a storage key. */
export const documentFileUrl = (documentId: string) => `/api/files/${encodeURIComponent(documentId)}`;
