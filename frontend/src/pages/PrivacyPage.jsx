import { LockIcon } from "lucide-react";
import StaticPageLayout from "../components/StaticPageLayout";

function PrivacyPage() {
  return (
    <StaticPageLayout title="Privacy policy" icon={LockIcon}>
      <p>
        This is a summary of what we collect and why — replace with your
        counsel-reviewed policy before taking real orders.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Account info (name, email) via Clerk, our authentication provider.</li>
        <li>Order details and the shipping address you enter at checkout.</li>
        <li>Support chat messages tied to your order, via Stream Chat.</li>
      </ul>

      <h2>What we don't collect</h2>
      <p>
        We never see or store your card details — payment is handled entirely
        by Polar's hosted checkout.
      </p>

      <h2>Third parties</h2>
      <p>
        We use Clerk (auth), Polar (payments), Stream (chat/video), ImageKit
        (product images), and Sentry (error monitoring) to run the store.
        Each only receives the data it needs to do its job.
      </p>
    </StaticPageLayout>
  );
}

export default PrivacyPage;
