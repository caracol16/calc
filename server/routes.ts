import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Calculation of translation costs", pageWidth / 2, 20, { align: "center" });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Date: ${new Date().toLocaleDateString("ru-RU")}`, 14, 30);
      
      let yPos = 40;
      
      summary.tasks.forEach((calc, index) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`${calc.task.name}`, 14, yPos);
        yPos += 8;
        
        const tableData = [
          ["New words", formatInteger(calc.task.newWords)],
          ["Repeats", formatInteger(calc.task.repeats)],
          ["Cross-file repeats", formatInteger(calc.task.crossFileRepeats)],
          ["Total words", formatInteger(calc.totalWords)],
          ["Cost per word", `${formatNumber(calc.task.costPerWord)} RUB`],
          ["Repeat discount", `${calc.task.repeatDiscount}% (${formatNumber(calc.costPerRepeat)} RUB)`],
          ["Words per day", formatInteger(calc.task.wordsPerDay)],
          ["New words cost", `${formatNumber(calc.newWordsCost)} RUB`],
          ["Repeats cost", `${formatNumber(calc.repeatCost)} RUB`],
          ["Total cost", `${formatNumber(calc.totalCost)} RUB`],
          ["Deadline", calc.requiresIndividualQuote ? "Individual calculation" : `${calc.estimatedDays} days`],
        ];
        
        autoTable(doc, {
          startY: yPos,
          head: [["Parameter", "Value"]],
          body: tableData,
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14, right: 14 },
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
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Summary", 14, yPos);
        yPos += 8;
        
        const summaryTableData = summary.tasks.map((calc) => [
          calc.task.name,
          formatInteger(calc.totalWords),
          `${formatNumber(calc.totalCost)} RUB`,
          calc.requiresIndividualQuote ? "Indiv." : `${calc.estimatedDays} d.`,
        ]);
        
        summaryTableData.push([
          "TOTAL",
          formatInteger(summary.totalWords),
          `${formatNumber(summary.grandTotal)} RUB`,
          "",
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [["Task", "Words", "Cost", "Deadline"]],
          body: summaryTableData,
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14, right: 14 },
          foot: [],
        });
      }
      
      const pdfBuffer = doc.output("arraybuffer");
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="translation-calculation.pdf"');
      res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error("PDF export error:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });
  
  app.post("/api/export/excel", async (req: Request, res: Response) => {
    try {
      const { tasks, summary } = req.body as ExportRequest;
      
      const workbook = XLSX.utils.book_new();
      
      summary.tasks.forEach((calc, index) => {
        const wsData = [
          [calc.task.name],
          [],
          ["Parameter", "Value"],
          ["New words", calc.task.newWords],
          ["Repeats", calc.task.repeats],
          ["Cross-file repeats", calc.task.crossFileRepeats],
          ["Total words", calc.totalWords],
          ["Cost per word (RUB)", calc.task.costPerWord],
          ["Repeat discount (%)", calc.task.repeatDiscount],
          ["Cost per repeat (RUB)", calc.costPerRepeat],
          ["Words per day", calc.task.wordsPerDay],
          [],
          ["Calculations"],
          ["New words cost (RUB)", calc.newWordsCost],
          ["Repeats cost (RUB)", calc.repeatCost],
          ["Total cost (RUB)", calc.totalCost],
          ["Deadline", calc.requiresIndividualQuote ? "Individual calculation" : `${calc.estimatedDays} days`],
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        ws["!cols"] = [{ wch: 25 }, { wch: 20 }];
        
        const sheetName = calc.task.name.substring(0, 31);
        XLSX.utils.book_append_sheet(workbook, ws, sheetName);
      });
      
      if (summary.tasks.length > 1) {
        const summaryData = [
          ["Summary"],
          [],
          ["Task", "Words", "Cost (RUB)", "Deadline"],
          ...summary.tasks.map((calc) => [
            calc.task.name,
            calc.totalWords,
            calc.totalCost,
            calc.requiresIndividualQuote ? "Individual" : `${calc.estimatedDays} days`,
          ]),
          [],
          ["TOTAL", summary.totalWords, summary.grandTotal, ""],
        ];
        
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        summaryWs["!cols"] = [{ wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, summaryWs, "Summary");
      }
      
      const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="translation-calculation.xlsx"');
      res.send(excelBuffer);
    } catch (error) {
      console.error("Excel export error:", error);
      res.status(500).json({ error: "Failed to generate Excel" });
    }
  });

  return httpServer;
}
