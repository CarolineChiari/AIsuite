export interface Speech {
  id: string;
  text: string;
  language: string;
  voice?: string;
  file?: string;
  user?: string;
  embedding: number[];
  cosine?: number;
}
