export interface formula {
  name: string;
  description: string;
  input: {
    name: string;
    tag: string;
    value?: string;
  }[];
  prompts: {
    text: string;
    input: {
      name: string;
      tag: string;
      value?: string;
    }[];
    displayOutput?: boolean;
    output?: string;
  }[];
}
