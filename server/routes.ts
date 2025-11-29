import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { robotoBase64 } from "./fonts/roboto-font";
import { robotoBoldBase64 } from "./fonts/roboto-bold-font";

interface Task {
  id: string;
  name: string;
  newWords: number;
  repeats: number;
  crossFileRepeats: number;
  costPerWord: number;
  repeatDiscount: number;
  wordsPerDay: number;
}

interface TaskCalculation {
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

interface CalculationSummary {
  tasks: TaskCalculation[];
  grandTotal: number;
  totalWords: number;
}

interface ExportRequest {
  tasks: Task[];
  summary: CalculationSummary;
}

function formatNumber(num: number): string {
  return num.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatInteger(num: number): string {
  return num.toLocaleString("ru-RU");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/export/pdf", async (req: Request, res: Response) => {
    try {
      const { tasks, summary } = req.body as ExportRequest;
      
      if (!summary || !summary.tasks || !Array.isArray(summary.tasks)) {
        return res.status(400).json({ error: "Invalid request body" });
      }
      
      const doc = new jsPDF();
      
      doc.addFileToVFS("Roboto-Regular.ttf", robotoBase64);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      doc.addFileToVFS("Roboto-Bold.ttf", robotoBoldBase64);
      doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
      doc.setFont("Roboto", "normal");
      
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFontSize(18);
      doc.text("Расчет стоимости перевода", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.text(`Дата: ${new Date().toLocaleDateString("ru-RU")}`, 14, 30);
      
      let yPos = 40;
      
      summary.tasks.forEach((calc, index) => {
        doc.setFontSize(12);
        doc.text(calc.task.name, 14, yPos);
        yPos += 8;
        
        const tableData = [
          ["Новых слов", formatInteger(calc.task.newWords)],
          ["Повторов", formatInteger(calc.task.repeats)],
          ["Повторов через файл", formatInteger(calc.task.crossFileRepeats)],
          ["Всего слов", formatInteger(calc.totalWords)],
          ["Стоимость за слово", `${formatNumber(calc.task.costPerWord)} руб.`],
          ["Скидка на повторы", `${calc.task.repeatDiscount}% (${formatNumber(calc.costPerRepeat)} руб.)`],
          ["Слов в день", formatInteger(calc.task.wordsPerDay)],
          ["Стоимость новых слов", `${formatNumber(calc.newWordsCost)} руб.`],
          ["Стоимость повторов", `${formatNumber(calc.repeatCost)} руб.`],
          ["Итоговая стоимость", `${formatNumber(calc.totalCost)} руб.`],
          ["Сроки", calc.requiresIndividualQuote ? "Рассчитывается индивидуально" : `${calc.estimatedDays} дней`],
        ];
        
        autoTable(doc, {
          startY: yPos,
          head: [["Параметр", "Значение"]],
          body: tableData,
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246], font: "Roboto", fontStyle: "bold" },
          bodyStyles: { font: "Roboto", fontStyle: "normal" },
          margin: { left: 14, right: 14 },
          styles: { font: "Roboto" },
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
        
        if (yPos > 250 && index < summary.tasks.length - 1) {
          doc.addPage();
          yPos = 20;
        }
      });
      
      if (summary.tasks.length > 1) {
        if (yPos > 220) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.text("Общий итог", 14, yPos);
        yPos += 8;
        
        const summaryTableData = summary.tasks.map((calc) => [
          calc.task.name,
          formatInteger(calc.totalWords),
          `${formatNumber(calc.totalCost)} руб.`,
          calc.requiresIndividualQuote ? "Индивид." : `${calc.estimatedDays} дн.`,
        ]);
        
        summaryTableData.push([
          "ИТОГО",
          formatInteger(summary.totalWords),
          `${formatNumber(summary.grandTotal)} руб.`,
          "",
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [["Задание", "Слов", "Стоимость", "Сроки"]],
          body: summaryTableData,
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246], font: "Roboto", fontStyle: "bold" },
          bodyStyles: { font: "Roboto", fontStyle: "normal" },
          margin: { left: 14, right: 14 },
          styles: { font: "Roboto" },
        });
      }
      
      const pdfBuffer = doc.output("arraybuffer");
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="raschet-perevoda.pdf"');
      res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error("PDF export error:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });
  
  app.post("/api/export/excel", async (req: Request, res: Response) => {
    try {
      const { tasks, summary } = req.body as ExportRequest;
      
      if (!summary || !summary.tasks || !Array.isArray(summary.tasks)) {
        return res.status(400).json({ error: "Invalid request body" });
      }
      
      const workbook = XLSX.utils.book_new();
      
      summary.tasks.forEach((calc, index) => {
        const wsData = [
          [calc.task.name],
          [],
          ["Параметр", "Значение"],
          ["Новых слов", calc.task.newWords],
          ["Повторов", calc.task.repeats],
          ["Повторов через файл", calc.task.crossFileRepeats],
          ["Всего слов", calc.totalWords],
          ["Стоимость за слово (руб.)", calc.task.costPerWord],
          ["Скидка на повторы (%)", calc.task.repeatDiscount],
          ["Стоимость за повтор (руб.)", calc.costPerRepeat],
          ["Слов в день", calc.task.wordsPerDay],
          [],
          ["Расчеты"],
          ["Стоимость новых слов (руб.)", calc.newWordsCost],
          ["Стоимость повторов (руб.)", calc.repeatCost],
          ["Итоговая стоимость (руб.)", calc.totalCost],
          ["Сроки", calc.requiresIndividualQuote ? "Рассчитывается индивидуально" : `${calc.estimatedDays} дней`],
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        ws["!cols"] = [{ wch: 30 }, { wch: 25 }];
        
        const sheetName = calc.task.name.substring(0, 31).replace(/[\\/?*[\]]/g, "-");
        XLSX.utils.book_append_sheet(workbook, ws, sheetName);
      });
      
      if (summary.tasks.length > 1) {
        const summaryData = [
          ["Общий итог"],
          [],
          ["Задание", "Слов", "Стоимость (руб.)", "Сроки"],
          ...summary.tasks.map((calc) => [
            calc.task.name,
            calc.totalWords,
            calc.totalCost,
            calc.requiresIndividualQuote ? "Индивидуально" : `${calc.estimatedDays} дней`,
          ]),
          [],
          ["ИТОГО", summary.totalWords, summary.grandTotal, ""],
        ];
        
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        summaryWs["!cols"] = [{ wch: 30 }, { wch: 12 }, { wch: 18 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(workbook, summaryWs, "Итог");
      }
      
      const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="raschet-perevoda.xlsx"');
      res.send(excelBuffer);
    } catch (error) {
      console.error("Excel export error:", error);
      res.status(500).json({ error: "Failed to generate Excel" });
    }
  });

  return httpServer;
}
