import "server-only";

import { prisma } from "@/lib/prisma";
import { DocumentRequestStatus, PaymentStatus } from "@/app/generated/prisma/enums";

export interface COACollectionItemDTO {
  id: string;
  orNumber: string;
  payerName: string;
  documentOrPurpose: string;
  amount: number;
  date: string;
  method: string;
  status: string;
  type: "DOCUMENT_FEE" | "DIRECT_PAYMENT";
}

export interface COAReportSummaryDTO {
  totalGrossCollections: number;
  cashTotal: number;
  gCashTotal: number;
  mayaTotal: number;
  totalReceiptsCount: number;
}

export interface COAReportFilter {
  startDate?: string;
  endDate?: string;
  method?: string;
}

/**
 * Queries payments and verified document request collections for COA Financial Reports.
 */
export async function getCOACollectionReport(filter?: COAReportFilter): Promise<{
  items: COACollectionItemDTO[];
  summary: COAReportSummaryDTO;
}> {
  try {
    const whereDoc: any = {
      status: {
        in: [
          DocumentRequestStatus.PROCESSING,
          DocumentRequestStatus.READY,
          DocumentRequestStatus.CLAIMED,
        ],
      },
    };

    const wherePayment: any = {
      status: PaymentStatus.VERIFIED,
    };

    if (filter?.startDate || filter?.endDate) {
      const dateRange: any = {};
      if (filter.startDate) dateRange.gte = new Date(filter.startDate);
      if (filter.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        dateRange.lte = end;
      }
      whereDoc.createdAt = dateRange;
      wherePayment.createdAt = dateRange;
    }

    if (filter?.method && filter.method !== "ALL") {
      whereDoc.method = filter.method;
      wherePayment.method = filter.method;
    }

    const [docRequests, directPayments] = await Promise.all([
      prisma.documentRequest.findMany({
        where: whereDoc,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orNumber: true,
          referenceNumber: true,
          requesterName: true,
          documentName: true,
          fee: true,
          method: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.payment.findMany({
        where: wherePayment,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          referenceNumber: true,
          payerName: true,
          purpose: true,
          amount: true,
          method: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const items: COACollectionItemDTO[] = [];

    // Map document request collections
    for (const d of docRequests) {
      items.push({
        id: d.id,
        orNumber: d.orNumber || d.referenceNumber,
        payerName: d.requesterName,
        documentOrPurpose: d.documentName,
        amount: Number(d.fee),
        date: d.createdAt.toISOString(),
        method: d.method,
        status: d.status,
        type: "DOCUMENT_FEE",
      });
    }

    // Map direct treasury payments
    for (const p of directPayments) {
      items.push({
        id: p.id,
        orNumber: p.referenceNumber || `REF-${p.id.slice(0, 8)}`,
        payerName: p.payerName,
        documentOrPurpose: p.purpose,
        amount: Number(p.amount),
        date: p.createdAt.toISOString(),
        method: p.method,
        status: p.status,
        type: "DIRECT_PAYMENT",
      });
    }

    // Sort combined collections newest first
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate COA Summary Metrics
    let totalGrossCollections = 0;
    let cashTotal = 0;
    let gCashTotal = 0;
    let mayaTotal = 0;

    for (const item of items) {
      totalGrossCollections += item.amount;
      if (item.method === "CASH") cashTotal += item.amount;
      if (item.method === "GCASH") gCashTotal += item.amount;
      if (item.method === "MAYA") mayaTotal += item.amount;
    }

    const summary: COAReportSummaryDTO = {
      totalGrossCollections,
      cashTotal,
      gCashTotal,
      mayaTotal,
      totalReceiptsCount: items.length,
    };

    return { items, summary };
  } catch (error) {
    console.error("Error generating COA collection report:", error);
    return {
      items: [],
      summary: {
        totalGrossCollections: 0,
        cashTotal: 0,
        gCashTotal: 0,
        mayaTotal: 0,
        totalReceiptsCount: 0,
      },
    };
  }
}

/**
 * Formats report data into Commission on Audit (COA) Official CSV text format.
 */
export function generateCOACSVData(
  items: COACollectionItemDTO[],
  summary: COAReportSummaryDTO,
  startDate?: string,
  endDate?: string
): string {
  const dateStr = new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const periodLabel =
    startDate || endDate
      ? `${startDate || "Beginning"} to ${endDate || "Present"}`
      : "All Period Collections";

  const lines: string[] = [
    `REPUBLIC OF THE PHILIPPINES`,
    `BARANGAY LIBTANGIN - OFFICE OF THE BARANGAY TREASURER`,
    `COMMISSION ON AUDIT (COA) OFFICIAL STATEMENT OF COLLECTIONS AND DEPOSITS`,
    `Report Generated Date: ${dateStr}`,
    `Reporting Period: ${periodLabel}`,
    ``,
    `SUMMARY METRICS`,
    `Total Official Collections,PHP ${summary.totalGrossCollections.toFixed(2)}`,
    `Cash Collections,PHP ${summary.cashTotal.toFixed(2)}`,
    `GCash Digital Collections,PHP ${summary.gCashTotal.toFixed(2)}`,
    `Maya Digital Collections,PHP ${summary.mayaTotal.toFixed(2)}`,
    `Total Transactions / Receipts Issued,${summary.totalReceiptsCount}`,
    ``,
    `DETAILED COLLECTIONS LOG`,
    `OR / Ref No.,Payer Name,Document / Service Purpose,Payment Method,Amount (PHP),Date & Time,Status`,
  ];

  for (const item of items) {
    const formattedDate = new Date(item.date).toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;

    lines.push(
      [
        escapeCsv(item.orNumber),
        escapeCsv(item.payerName),
        escapeCsv(item.documentOrPurpose),
        escapeCsv(item.method),
        item.amount.toFixed(2),
        escapeCsv(formattedDate),
        escapeCsv(item.status),
      ].join(",")
    );
  }

  lines.push(
    ``,
    `TOTAL,,""," TOTAL GROSS COLLECTIONS",${summary.totalGrossCollections.toFixed(2)},,`
  );

  return lines.join("\n");
}
