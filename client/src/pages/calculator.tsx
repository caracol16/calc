import { useState, useCallback, useRef, useEffect } from "react";
import { Plus, Trash2, FileDown, FileSpreadsheet, Calculator, RefreshCw, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Task,
  calculateTask,
  calculateSummary,
  TaskCalculation,
} from "@shared/schema";
import { ChevronDown, Settings2 } from "lucide-react";

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function createDefaultTask(index: number): Omit<Task, "id"> {
  return {
    name: `Задание ${index + 1}`,
    newWords: 0,
    repeats: 0,
    crossFileRepeats: 0,
    costPerWord: 3.9,
    repeatDiscount: 30,
    wordsPerDay: 1750,
  };
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatInteger(num: number): string {
  return new Intl.NumberFormat("ru-RU").format(num);
}

interface EditableTitleProps {
  value: string;
  onChange: (value: string) => void;
  index: number;
}

function EditableTitle({ value, onChange, index }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed) {
      onChange(trimmed);
    } else {
      setEditValue(value);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="text-xl font-semibold h-8 w-auto min-w-[150px] max-w-[300px]"
        data-testid={`input-task-name-${index}`}
      />
    );
  }

  return (
    <div 
      className="group flex items-center gap-2 cursor-pointer"
      onClick={() => setIsEditing(true)}
      data-testid={`text-task-name-${index}`}
    >
      <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
        {value}
      </CardTitle>
      <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  index: number;
  calculation: TaskCalculation;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

function TaskCard({ task, index, calculation, onUpdate, onRemove, canRemove }: TaskCardProps) {
  const [tariffOpen, setTariffOpen] = useState(false);

  return (
    <Card className="border-card-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground font-semibold text-sm">
              {index + 1}
            </div>
            <EditableTitle
              value={task.name}
              onChange={(name) => onUpdate(task.id, { name })}
              index={index}
            />
          </div>
          <div className="flex items-center gap-2">
            {canRemove && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(task.id)}
                data-testid={`button-remove-task-${task.id}`}
              >
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`newWords-${task.id}`} className="text-sm font-medium">
              Новых слов
            </Label>
            <Input
              id={`newWords-${task.id}`}
              type="number"
              min="0"
              value={task.newWords || ""}
              onChange={(e) => onUpdate(task.id, { newWords: parseInt(e.target.value) || 0 })}
              placeholder="0"
              data-testid={`input-new-words-${task.id}`}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`repeats-${task.id}`} className="text-sm font-medium">
              Повторов
            </Label>
            <Input
              id={`repeats-${task.id}`}
              type="number"
              min="0"
              value={task.repeats || ""}
              onChange={(e) => onUpdate(task.id, { repeats: parseInt(e.target.value) || 0 })}
              placeholder="0"
              data-testid={`input-repeats-${task.id}`}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`crossFileRepeats-${task.id}`} className="text-sm font-medium">
              Повторов через файл
            </Label>
            <Input
              id={`crossFileRepeats-${task.id}`}
              type="number"
              min="0"
              value={task.crossFileRepeats || ""}
              onChange={(e) => onUpdate(task.id, { crossFileRepeats: parseInt(e.target.value) || 0 })}
              placeholder="0"
              data-testid={`input-cross-file-repeats-${task.id}`}
            />
          </div>
        </div>

        <Collapsible open={tariffOpen} onOpenChange={setTariffOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between px-0"
              data-testid={`button-toggle-tariff-${task.id}`}
            >
              <span className="flex items-center gap-2 text-muted-foreground">
                <Settings2 className="w-4 h-4" />
                Настройки тарифа
              </span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${tariffOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-md">
              <div className="space-y-2">
                <Label htmlFor={`costPerWord-${task.id}`} className="text-sm font-medium">
                  Стоимость за слово (руб.)
                </Label>
                <Input
                  id={`costPerWord-${task.id}`}
                  type="number"
                  min="0"
                  step="0.1"
                  value={task.costPerWord || ""}
                  onChange={(e) => onUpdate(task.id, { costPerWord: parseFloat(e.target.value) || 0 })}
                  placeholder="3.9"
                  data-testid={`input-cost-per-word-${task.id}`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`repeatDiscount-${task.id}`} className="text-sm font-medium">
                  Скидка на повторы (%)
                </Label>
                <Input
                  id={`repeatDiscount-${task.id}`}
                  type="number"
                  min="0"
                  max="100"
                  value={task.repeatDiscount || ""}
                  onChange={(e) => onUpdate(task.id, { repeatDiscount: parseFloat(e.target.value) || 0 })}
                  placeholder="30"
                  data-testid={`input-repeat-discount-${task.id}`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`wordsPerDay-${task.id}`} className="text-sm font-medium">
                  Слов в рабочий день
                </Label>
                <Input
                  id={`wordsPerDay-${task.id}`}
                  type="number"
                  min="1"
                  value={task.wordsPerDay || ""}
                  onChange={(e) => onUpdate(task.id, { wordsPerDay: parseInt(e.target.value) || 1 })}
                  placeholder="1750"
                  data-testid={`input-words-per-day-${task.id}`}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        <div className="space-y-4">
          <h4 className="text-lg font-medium flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Результаты расчета
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/30 rounded-md">
              <p className="text-xs text-muted-foreground mb-1">Всего слов</p>
              <p className="text-lg font-semibold font-mono" data-testid={`text-total-words-${task.id}`}>
                {formatInteger(calculation.totalWords)}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-md">
              <p className="text-xs text-muted-foreground mb-1">Стоимость за повтор</p>
              <p className="text-lg font-semibold font-mono" data-testid={`text-cost-per-repeat-${task.id}`}>
                {formatNumber(calculation.costPerRepeat)} ₽
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-md">
              <p className="text-xs text-muted-foreground mb-1">Сроки</p>
              <p className="text-lg font-semibold font-mono" data-testid={`text-deadline-${task.id}`}>
                {calculation.requiresIndividualQuote 
                  ? <span className="text-sm">Индивидуально</span>
                  : `${calculation.estimatedDays} дней`
                }
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-md">
              <p className="text-xs text-muted-foreground mb-1">Итого</p>
              <p className="text-lg font-bold font-mono text-primary" data-testid={`text-total-cost-${task.id}`}>
                {formatNumber(calculation.totalCost)} ₽
              </p>
            </div>
          </div>

          <Card className="bg-card/50 border-card-border">
            <CardContent className="p-4">
              <h5 className="text-sm font-medium mb-3 text-muted-foreground">Детали расчетов:</h5>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Стоимость новых слов:</span>
                  <span data-testid={`text-new-words-cost-${task.id}`}>
                    {formatInteger(task.newWords)} × {formatNumber(task.costPerWord)} = <strong>{formatNumber(calculation.newWordsCost)} ₽</strong>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Стоимость повторов:</span>
                  <span data-testid={`text-repeats-cost-${task.id}`}>
                    ({formatInteger(task.repeats)} + {formatInteger(task.crossFileRepeats)}) × {formatNumber(calculation.costPerRepeat)} = <strong>{formatNumber(calculation.repeatCost)} ₽</strong>
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center text-base">
                  <span className="font-medium">Итоговая стоимость:</span>
                  <span className="font-bold text-primary" data-testid={`text-final-cost-${task.id}`}>
                    {formatNumber(calculation.newWordsCost)} + {formatNumber(calculation.repeatCost)} = {formatNumber(calculation.totalCost)} ₽
                  </span>
                </div>
                {!calculation.requiresIndividualQuote && calculation.estimatedDays && (
                  <>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Расчет сроков:</span>
                      <span data-testid={`text-deadline-calc-${task.id}`}>
                        {formatInteger(calculation.totalWords)} / {formatInteger(task.wordsPerDay)} + 1 = {calculation.estimatedDays} дней
                      </span>
                    </div>
                  </>
                )}
                {calculation.requiresIndividualQuote && (
                  <>
                    <Separator className="my-2" />
                    <div className="text-muted-foreground text-xs">
                      * Сроки рассчитываются индивидуально, так как общее количество слов превышает 25 000.
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

interface SummaryPanelProps {
  summary: ReturnType<typeof calculateSummary>;
  onExportPDF: () => void;
  onExportExcel: () => void;
  isExporting: boolean;
}

function SummaryPanel({ summary, onExportPDF, onExportExcel, isExporting }: SummaryPanelProps) {
  if (summary.tasks.length <= 1) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Общий итог
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-background rounded-md">
            <p className="text-sm text-muted-foreground mb-1">Всего заданий</p>
            <p className="text-2xl font-bold font-mono" data-testid="text-total-tasks">
              {summary.tasks.length}
            </p>
          </div>
          <div className="p-4 bg-background rounded-md">
            <p className="text-sm text-muted-foreground mb-1">Всего слов</p>
            <p className="text-2xl font-bold font-mono" data-testid="text-summary-total-words">
              {formatInteger(summary.totalWords)}
            </p>
          </div>
          <div className="p-4 bg-primary/10 rounded-md">
            <p className="text-sm text-muted-foreground mb-1">Общая стоимость</p>
            <p className="text-2xl font-bold font-mono text-primary" data-testid="text-grand-total">
              {formatNumber(summary.grandTotal)} ₽
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium">Задание</th>
                <th className="text-right py-2 px-3 font-medium">Слов</th>
                <th className="text-right py-2 px-3 font-medium">Стоимость</th>
                <th className="text-right py-2 px-3 font-medium">Сроки</th>
              </tr>
            </thead>
            <tbody>
              {summary.tasks.map((calc) => (
                <tr key={calc.task.id} className="border-b border-border/50">
                  <td className="py-2 px-3">{calc.task.name}</td>
                  <td className="py-2 px-3 text-right font-mono">{formatInteger(calc.totalWords)}</td>
                  <td className="py-2 px-3 text-right font-mono font-medium">{formatNumber(calc.totalCost)} ₽</td>
                  <td className="py-2 px-3 text-right font-mono">
                    {calc.requiresIndividualQuote ? "Индивид." : `${calc.estimatedDays} дн.`}
                  </td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="py-2 px-3">Итого:</td>
                <td className="py-2 px-3 text-right font-mono">{formatInteger(summary.totalWords)}</td>
                <td className="py-2 px-3 text-right font-mono text-primary">{formatNumber(summary.grandTotal)} ₽</td>
                <td className="py-2 px-3"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button
            variant="outline"
            onClick={onExportPDF}
            disabled={isExporting}
            data-testid="button-export-pdf-summary"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Экспорт в PDF
          </Button>
          <Button
            variant="outline"
            onClick={onExportExcel}
            disabled={isExporting}
            data-testid="button-export-excel-summary"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Экспорт в Excel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CalculatorPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([
    { id: generateId(), ...createDefaultTask(0) },
  ]);
  const [isExporting, setIsExporting] = useState(false);

  const summary = calculateSummary(tasks);

  const handleAddTask = useCallback(() => {
    setTasks((prev) => [...prev, { id: generateId(), ...createDefaultTask(prev.length) }]);
  }, []);

  const handleUpdateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updates } : task))
    );
  }, []);

  const handleRemoveTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const handleReset = useCallback(() => {
    setTasks([{ id: generateId(), ...createDefaultTask(0) }]);
    toast({
      title: "Калькулятор сброшен",
      description: "Все данные очищены",
    });
  }, [toast]);

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, summary }),
      });
      
      if (!response.ok) throw new Error("Ошибка экспорта");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `translation-calculation-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "PDF экспортирован",
        description: "Файл успешно скачан",
      });
    } catch (error) {
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось создать PDF файл",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [tasks, summary, toast]);

  const handleExportExcel = useCallback(async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/export/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, summary }),
      });
      
      if (!response.ok) throw new Error("Ошибка экспорта");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `translation-calculation-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Excel экспортирован",
        description: "Файл успешно скачан",
      });
    } catch (error) {
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось создать Excel файл",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [tasks, summary, toast]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
                <Calculator className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Калькулятор переводов</h1>
                <p className="text-xs md:text-sm text-muted-foreground">Расчет стоимости и сроков</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                data-testid="button-reset"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Сбросить
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting || summary.grandTotal === 0}
                data-testid="button-export-pdf"
              >
                <FileDown className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={isExporting || summary.grandTotal === 0}
                data-testid="button-export-excel"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
        {tasks.map((task, index) => {
          const calculation = calculateTask(task);
          return (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              calculation={calculation}
              onUpdate={handleUpdateTask}
              onRemove={handleRemoveTask}
              canRemove={tasks.length > 1}
            />
          );
        })}

        <Button
          onClick={handleAddTask}
          className="w-full"
          variant="outline"
          size="lg"
          data-testid="button-add-task"
        >
          <Plus className="w-5 h-5 mr-2" />
          Добавить задание
        </Button>

        <SummaryPanel
          summary={summary}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
          isExporting={isExporting}
        />
      </main>

    </div>
  );
}
