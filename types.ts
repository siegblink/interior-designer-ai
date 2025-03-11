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
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  parameters: ModelParameter[];
  requiresImage: boolean;
  requiresStyle: boolean;
  requiresRoomType: boolean;
}

export interface ImageAreaProps {
  title: string;
  icon: any;
}

export interface ModelValues {
  [key: string]: any;
} 