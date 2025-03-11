import { ModelParameter, ModelValues } from "@/types";

interface ModelParametersProps {
  parameters: ModelParameter[];
  values: ModelValues;
  onChange: (name: string, value: any) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}

export function ModelParameters({ parameters, values, onChange, showAdvanced, onToggleAdvanced }: ModelParametersProps) {
  const visibleParameters = parameters.filter(param => !param.isAdvanced || showAdvanced);

  return (
    <div className="space-y-4">
      {parameters.some(p => p.isAdvanced) && (
        <button
          onClick={onToggleAdvanced}
          className="mb-4 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
        </button>
      )}

      {visibleParameters.map((param) => (
        <div key={param.name} className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-300">
            {param.label}
            {param.description && (
              <span className="ml-2 text-xs text-gray-500">{param.description}</span>
            )}
          </label>
          
          {param.type === "string" && (
            <input
              type="text"
              value={values[param.name] ?? param.default ?? ""}
              onChange={(e) => onChange(param.name, e.target.value)}
              className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
            />
          )}

          {param.type === "number" && (
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={values[param.name] ?? param.default ?? 0}
                onChange={(e) => onChange(param.name, parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="w-20 text-sm text-gray-300">
                {values[param.name] ?? param.default}
              </span>
            </div>
          )}

          {param.type === "boolean" && (
            <input
              type="checkbox"
              checked={values[param.name] ?? param.default ?? false}
              onChange={(e) => onChange(param.name, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
          )}
        </div>
      ))}
    </div>
  );
} 