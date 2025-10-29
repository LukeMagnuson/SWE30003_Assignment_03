import Order from './Order';
import SalesReport, { SalesReportSummary } from './SalesReport';
import { Cents } from './Product';

export class ReportGenerator {
  /**
   * Generate a basic sales report for orders within [start, end].
   */
  generate(orders: Order[], start: Date, end: Date): SalesReport {
    const startMs = start.getTime();
    const endMs = end.getTime();
    const inRange = orders.filter((o) => {
      const t = o.createdAt.getTime();
      return t >= startMs && t <= endMs;
    });

    const ordersByStatus: Record<string, number> = {};
    let totalOrders = 0;
    let totalRevenueCents: Cents = 0;
    let totalGstCents: Cents = 0;

    const productAgg = new Map<string, { productId: string; name: string; quantitySold: number; revenueCents: Cents }>();

    for (const o of inRange) {
      totalOrders += 1;
      ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;
      totalRevenueCents += o.totalCents;
      totalGstCents += o.gstCents;
      for (const item of o.items) {
        const existing = productAgg.get(item.productId) ?? {
          productId: item.productId,
          name: item.name,
          quantitySold: 0,
          revenueCents: 0
        };
        existing.quantitySold += item.quantity;
        existing.revenueCents += item.lineTotalCents;
        productAgg.set(item.productId, existing);
      }
    }

    const topProducts = Array.from(productAgg.values())
      .sort((a, b) => b.revenueCents - a.revenueCents)
      .slice(0, 10);

    const summary: SalesReportSummary = {
      periodStart: new Date(startMs).toISOString(),
      periodEnd: new Date(endMs).toISOString(),
      totalOrders,
      totalRevenueCents,
      totalGstCents,
      ordersByStatus,
      topProducts
    };

    return new SalesReport(summary);
  }
}

export default ReportGenerator;
