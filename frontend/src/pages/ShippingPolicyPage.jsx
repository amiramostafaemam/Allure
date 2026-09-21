import { TruckIcon } from "lucide-react";
import StaticPageLayout from "../components/StaticPageLayout";

function ShippingPolicyPage() {
  return (
    <StaticPageLayout title="Shipping policy" icon={TruckIcon}>
      <p>
        We ship to the address you provide at checkout — double-check it
        before paying, since it's what our team ships to.
      </p>

      <h2>Order status</h2>
      <p>
        Track every step on the order page: placed, paid, shipped, delivered.
        You'll see a timestamp for each, plus any note our team adds when
        marking an order shipped.
      </p>

      <h2>Delivery issues</h2>
      <p>
        If something arrives damaged or doesn't show up, open the order's
        support chat — that's the fastest way to reach our team, and it
        keeps the whole conversation attached to the right order.
      </p>
    </StaticPageLayout>
  );
}

export default ShippingPolicyPage;
