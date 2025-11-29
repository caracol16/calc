import { z } from "zod";

export const taskSchema = z.object({
  id: z.string(),
  name: z.string(),
  newWords: z.number().min(0),
  repeats: z.number().min(0),
  crossFileRepeats: z.number().min(0),
  costPerWord: z.number().min(0),
  repeatDiscount: z.number().min(0).max(100),
  wordsPerDay: z.number().min(1),
});

export type Task = z.infer<typeof taskSchema>;

export const insertTaskSchema = taskSchema.omit({ id: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;

export interface TaskCalculation {
  task: Task;
  totalWords: number;
  newWordsCost: number;
  repeatCost: number;
  totalRepeats: number;
  costPerRepeat: number;
  totalCost: number;
  estimatedDays: number | null;
  requiresIndividualQuote: boolean;
}

export interface CalculationSummary {
  tasks: TaskCalculation[];
  grandTotal: number;
  totalWords: number;
}

export function calculateTask(task: Task): TaskCalculation {
  const totalWords = task.newWords + task.repeats + task.crossFileRepeats;
  const newWordsCost = task.newWords * task.costPerWord;
  const costPerRepeat = task.costPerWord * (task.repeatDiscount / 100);
  const totalRepeats = task.repeats + task.crossFileRepeats;
  const repeatCost = totalRepeats * costPerRepeat;
  const totalCost = newWordsCost + repeatCost;
  
  const requiresIndividualQuote = totalWords > 25000;
  let estimatedDays: number | null = null;
  
  if (!requiresIndividualQuote) {
    estimatedDays = Math.ceil(totalWords / task.wordsPerDay + 1);
  }
  
  return {
    task,
    totalWords,
    newWordsCost,
    repeatCost,
    totalRepeats,
    costPerRepeat,
    totalCost,
    estimatedDays,
    requiresIndividualQuote,
  };
}

export function calculateSummary(tasks: Task[]): CalculationSummary {
  const calculations = tasks.map(calculateTask);
  const grandTotal = calculations.reduce((sum, calc) => sum + calc.totalCost, 0);
  const totalWords = calculations.reduce((sum, calc) => sum + calc.totalWords, 0);
  
  return {
    tasks: calculations,
    grandTotal,
    totalWords,
  };
}
