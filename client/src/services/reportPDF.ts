import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extended jsPDF type to include autoTable plugin properties
interface jsPDFWithPlugin extends jsPDF {
  lastAutoTable: { finalY: number };
}

export interface ReportData {
  callerNumber: string;
  peakRiskScore: number;
  finalRiskScore?: number;
  livenessScore?: number | null;
  scamType: string;
  summary: string;
  redFlags: string[];
  formalComplaintText: string;
  createdAt?: number | string | Date;
}

export const generatePDFReport = (reportData: ReportData) => {
  const doc = new jsPDF() as jsPDFWithPlugin;
  

  const pageWidth = doc.internal.pageSize.getWidth();
  // Coordinate Tracking:
  // PDF generation operates on a 2D canvas where Y flows downwards.
  // We use `currentY` to track vertical layout offsets manually, pushing elements down the page sequentially.
  let currentY = 20;


  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CYBER CRIME INCIDENT REPORT", pageWidth / 2, currentY, { align: "center" });
  

  const textWidth = doc.getTextWidth("CYBER CRIME INCIDENT REPORT");
  doc.setLineWidth(0.5);
  doc.line((pageWidth - textWidth) / 2, currentY + 2, (pageWidth + textWidth) / 2, currentY + 2);
  currentY += 15;

  // Incident Overview Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Complaint / Incident Details", 14, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
    headStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [0, 0, 0] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { cellWidth: 'auto' }
    },
    body: [
      ['Date Reported', new Date(reportData.createdAt || Date.now()).toLocaleString()],
      ['Suspect Caller Number', reportData.callerNumber],
      ['Category of complaint', 'Online Financial Fraud / Scams'],
      ['Sub-Category of complaint', reportData.scamType],
      ['AI Risk Assessment Score', `${reportData.peakRiskScore}/100`],
    ],
  });

  // autoTable finalY Hook:
  // autoTable draws tables dynamically based on content length.
  // We extract the exact vertical height of the rendered table (`lastAutoTable.finalY`) 
  // to perfectly shift the `currentY` offset for the next element (adding 10px padding).
  currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : currentY + 40;

  // Red Flags Detected Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Detected Red Flags / Manipulation Tactics", 14, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
    head: [['#', 'Red Flag Description']],
    headStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [0, 0, 0] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 15 },
      1: { cellWidth: 'auto' }
    },
    body: reportData.redFlags.map((flag, index) => [`${index + 1}`, flag]),
  });

  currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 15 : currentY + 15;

  // Incident Summary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Incident Summary", 14, currentY);
  currentY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  const summaryLines = doc.splitTextToSize(reportData.summary || 'No summary available.', pageWidth - 28);
  doc.text(summaryLines, 14, currentY);
  currentY += (summaryLines.length * 5) + 10;

  // Pagination Flow - Check Page break before FIR:
  // jsPDF does not auto-wrap elements onto new pages unless instructed.
  // If the vertical offset exceeds 230 points (near the bottom margin), we inject a new blank page
  // and reset `currentY` to the top margin (20) to prevent text clipping.
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  // Formal Complaint Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Formal Complaint Text (For Police FIR)", 14, currentY);
  currentY += 6;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  const complaintLines = doc.splitTextToSize(reportData.formalComplaintText || 'No complaint text generated.', pageWidth - 28);
  
  let remainingLines = [...complaintLines];
  while (remainingLines.length > 0) {
    const spaceLeft = 280 - currentY;
    const linesThatFit = Math.floor(spaceLeft / 5);
    
    if (linesThatFit <= 0) {
      doc.addPage();
      currentY = 20;
      continue;
    }
    
    const linesToDraw = remainingLines.slice(0, linesThatFit);
    doc.text(linesToDraw, 14, currentY);
    
    remainingLines = remainingLines.slice(linesThatFit);
    if (remainingLines.length > 0) {
      doc.addPage();
      currentY = 20;
    }
  }

  // Footer Generation:
  // Loops through every generated page retrospectively (`doc.setPage(i)`) 
  // to stamp a uniform footer containing the app name and current page number.
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text(
      `Generated by Dhwani AI - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      290,
      { align: "center" }
    );
  }
  
  doc.save(`Cyber_Crime_Incident_${reportData.callerNumber}.pdf`);
};

