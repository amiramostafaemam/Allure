import { FileTextIcon } from "lucide-react";
import StaticPageLayout from "../components/StaticPageLayout";

function TermsPage() {
  return (
    <StaticPageLayout title="Terms of service" icon={FileTextIcon}>
      <p>
        By placing an order on Allure, you agree to the terms below.
        This is a general summary, not legal advice — replace with your
        counsel-reviewed terms before taking real orders.
      </p>

      <h2>Orders and payment</h2>
      <p>
        Prices are shown in EGP and are confirmed by our server at checkout,
        not set by the browser. Payment is processed by Polar; we never see
        or store your card details. An order is confirmed once payment
        succeeds and you'll see it on your Orders page.
      </p>

      <h2>Cancellations and refunds</h2>
      <p>
        You can request a cancellation before an order ships, or a refund
        after, from the order page. Requests are reviewed by our team — a
        request doesn't guarantee approval, but every one gets a response.
      </p>

      <h2>Account</h2>
      <p>
        You're responsible for keeping your account credentials secure.
        Support and admin roles are granted only to our team.
      </p>
    </StaticPageLayout>
  );
}

export default TermsPage;
