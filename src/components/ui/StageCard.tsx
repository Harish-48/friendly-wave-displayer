
import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, Lock } from "lucide-react";

export interface StageCardProps {
  stage?: string;
  title: string;
  active?: boolean;
  completed?: boolean;
  children: ReactNode;
  className?: string;
  status?: string;
  date?: string;
  description?: string;
  isActive?: boolean;
  isCompleted?: boolean;
  isPending?: boolean;
}

export function StageCard({ 
  title, 
  active = false, 
  completed = false, 
  children, 
  className,
  stage,
  status,
  date,
  description,
  isActive,
  isCompleted,
  isPending = false
}: StageCardProps) {
  // Use the passed props or fallback to the original ones
  const isActiveState = isActive !== undefined ? isActive : active;
  const isCompletedState = isCompleted !== undefined ? isCompleted : completed;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "border rounded-xl overflow-hidden shadow-sm mb-6 transition-all duration-300",
        isActiveState ? "ring-2 ring-primary/20 bg-white shadow-md" : "bg-white/80",
        isCompletedState ? "border-green-200" : isPending ? "border-amber-200" : "border-border",
        className
      )}
    >
      <div className={cn(
        "px-6 py-4 border-b flex items-center justify-between",
        isCompletedState ? "bg-green-50 border-green-100" : 
        isPending ? "bg-amber-50 border-amber-100" :
        isActiveState ? "bg-blue-50 border-blue-100" : "bg-secondary/50"
      )}>
        <div className="flex items-center gap-3">
          {isCompletedState && (
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="text-white w-4 h-4" />
            </div>
          )}
          {isPending && (
            <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          )}
          {!isCompletedState && !isActiveState && !isPending && (
            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
              <Lock className="text-white w-4 h-4" />
            </div>
          )}
          <h3 className="font-medium text-lg">
            {title}
          </h3>
        </div>
        {isCompletedState && (
          <div className="rounded-full bg-green-500 text-white text-xs px-3 py-1">
            Completed
          </div>
        )}
        {isPending && (
          <div className="rounded-full bg-amber-500 text-white text-xs px-3 py-1">
            Pending Client
          </div>
        )}
        {isActiveState && !isCompletedState && !isPending && (
          <div className="rounded-full bg-blue-500 text-white text-xs px-3 py-1">
            Current Stage
          </div>
        )}
      </div>
      <div className="p-6">
        {children}
      </div>
    </motion.div>
  );
}
