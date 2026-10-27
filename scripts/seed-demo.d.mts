/** See seed-demo.mjs. */
export function seedDemo(db: { query: (text: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }> }): Promise<string>;
