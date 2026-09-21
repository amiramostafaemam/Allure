import { Link } from "react-router";
import { HeadphonesIcon, MailIcon, PackageIcon } from "lucide-react";
import StaticPageLayout from "../components/StaticPageLayout";

function ContactPage() {
  return (
    <StaticPageLayout title="Contact us" icon={MailIcon}>
      <p>
        The fastest way to reach us about an existing order is the support
        chat attached to that order — our team sees those first.
      </p>
      <Link to="/orders" className="btn btn-primary gap-2 shadow-md">
        <PackageIcon className="size-4" aria-hidden />
        Go to your orders
      </Link>

      <h2>Something else?</h2>
      <p className="flex items-start gap-2">
        <HeadphonesIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <span>
          For anything before you've placed an order — product questions,
          bulk pricing, partnerships — email us at{" "}
          <a href="mailto:hello@allure-supply.example" className="link link-primary">
            hello@allure-supply.example
          </a>
          . We typically reply within one business day.
        </span>
      </p>
    </StaticPageLayout>
  );
}

export default ContactPage;
