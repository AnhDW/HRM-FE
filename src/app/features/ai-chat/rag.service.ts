import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface RagChunk {
  id: string;
  text: string;
  source: string;
  metadata: {
    type: 'endpoint' | 'model' | 'route';
    path?: string;
    method?: string;
    summary?: string;
    tags?: string[];
    modelName?: string;
    label?: string;
    module?: string;
  };
}

interface RagIndex {
  chunks: RagChunk[];
  embeddings: number[][];
  model: string;
  generatedAt: string;
}

const LM_EMBED_URL = '/api/lm-studio/v1/embeddings';
const EMBEDDING_MODEL = 'text-embedding-nomic-embed-text-v1.5';

@Injectable({ providedIn: 'root' })
export class RagService {
  private http = inject(HttpClient);

  private index = signal<RagIndex | null>(null);
  loading = signal(false);
  loaded = signal(false);
  error = signal<string | null>(null);

  async loadIndex() {
    if (this.loaded()) return;
    this.loading.set(true);
    try {
      const data = await firstValueFrom(this.http.get<RagIndex>('/assets/rag-index.json'));
      this.index.set(data);
      this.loaded.set(true);
    } catch (err: any) {
      this.error.set('Không thể tải RAG index. Chạy `npm run generate-rag` trước.');
      console.warn('RAG index load failed:', err.message);
    } finally {
      this.loading.set(false);
    }
  }

  async search(query: string, topK: number = 5): Promise<RagChunk[]> {
    const idx = this.index();
    if (!idx || !idx.embeddings.length) return [];

    const queryEmbedding = await this.embedText(query);
    if (!queryEmbedding) return [];

    const scores = idx.embeddings.map((emb, i) => ({
      index: i,
      score: this.cosineSimilarity(queryEmbedding, emb),
    }));

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter(s => s.score > 0.3)
      .map(s => idx.chunks[s.index]);
  }

  buildSystemPrompt(context: string): string {
    return `Bạn là trợ lý AI chuyên sâu về hệ thống HRM (Human Resource Management). Trả lời bằng tiếng Việt, ngắn gọn, chính xác.

Khi được hỏi cách thực hiện một tác vụ trong giao diện (UI), hãy hướng dẫn từng bước cụ thể, KHÔNG đưa ra URL hay tên API.
Ví dụ:
  - Hỏi: "Làm sao đổi giao diện tối?" → Trả lời: "Nhấn vào avatar ở góc trên bên phải → chọn Cài đặt → chọn giao diện bạn muốn (Tối/Sáng/Hệ thống)"
  - Hỏi: "Xem lương ở đâu?" → Trả lời: "Vào menu Lương ở thanh bên trái, chọn tháng và năm, nhấn Xem"
  - KHÔNG đưa ra URL như "/api/..." hay "localhost:..."

Dưới đây là thông tin từ hệ thống có liên quan đến câu hỏi:

${context}

Dựa vào thông tin trên để trả lời. Nếu không đủ thông tin, hãy nói bạn không biết hoặc đề xuất người dùng hỏi điều khác.`;
  }

  private async embedText(text: string): Promise<number[] | null> {
    try {
      const response = await fetch(LM_EMBED_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: text,
        }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.data[0]?.embedding || null;
    } catch {
      return null;
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }
}
