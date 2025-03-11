export interface ModelParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  label: string;
  description?: string;
  default?: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  isAdvanced?: boolean;
}

export interface ModelOutput {
  output: string;
  mask?: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  parameters: ModelParameter[];
  requiresImage: boolean;
  requiresStyle: boolean;
  requiresRoomType: boolean;
  url: string;
  preprocessInput?: (input: any) => any;
  preprocessOutput: (output: any) => ModelOutput;
  hasMask: boolean;
}

export interface ImageAreaProps {
  title: string;
  icon: any;
}

export interface ModelValues {
  [key: string]: any;
} 