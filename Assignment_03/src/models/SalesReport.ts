import { Cents } from './Product';

export type SalesReportSummary = {
  periodStart: string; // ISO
  periodEnd: string;   // ISO
  totalOrders: number;
  totalRevenueCents: Cents;
  totalGstCents: Cents;
  ordersByStatus: Record<string, number>;
  topProducts: Array<{ productId: string; name: string; quantitySold: number; revenueCents: Cents }>;
};

export class SalesReport {
  private summary: SalesReportSummary;

  constructor(summary: SalesReportSummary) {
    this.summary = summary;
  }

  get data(): SalesReportSummary { return this.summary; }

  toJSON() {
    return this.summary;
  }
}

export default SalesReport;
