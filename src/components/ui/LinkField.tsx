
import React from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "./button";

export interface LinkFieldProps {
  label: string;
  value?: string;
  timestamp?: string;
  onEdit?: (value: string) => void;
  onSave?: (value: string) => void;
  readOnly?: boolean;
}

export function LinkField({ 
  label, 
  value, 
  timestamp, 
  onEdit, 
  onSave,
  readOnly = false 
}: LinkFieldProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {timestamp && (
          <span className="text-xs text-muted-foreground">
            {new Date(timestamp).toLocaleString()}
          </span>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {readOnly ? (
          <div className="flex-1 flex items-center">
            {value ? (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-primary hover:underline px-4 py-2 rounded bg-secondary/50"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Link
              </a>
            ) : (
              <span className="text-muted-foreground italic">No link provided yet</span>
            )}
          </div>
        ) : (
          <div className="flex flex-1">
            <input
              type="text"
              value={value || ""}
              onChange={(e) => onEdit?.(e.target.value)}
              placeholder="Enter drive link"
              className="w-full px-4 py-2 rounded-l border focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all duration-200"
            />
            {value && (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-r hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
      </div>
      
      {onSave && value && !readOnly && (
        <Button 
          onClick={() => onSave(value)}
          className="mt-2 text-sm"
          variant="outline"
          size="sm"
        >
          Save changes
        </Button>
      )}
    </div>
  );
}
