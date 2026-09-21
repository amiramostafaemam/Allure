import { HelpCircleIcon } from "lucide-react";
import StaticPageLayout from "../components/StaticPageLayout";

const FAQS = [
  {
    q: "How do I track my order?",
    a: "Open the order from your Orders page — it shows a step-by-step timeline (placed, paid, shipped, delivered) plus a live support chat once it's paid.",
  },
  {
    q: "Can I cancel or get a refund?",
    a: 'Yes. From the order page, use "Request cancellation" or "Request refund." Our team reviews every request and follows up in the order chat.',
  },
  {
    q: "How does the support chat work?",
    a: "Every paid order gets its own private chat thread with our team. If a call helps more than text, we'll drop a one-tap video link right into that thread.",
  },
  {
    q: "Which payment methods are accepted?",
    a: "Checkout is handled by Polar's secure hosted payment page — cards and the methods Polar supports in your region.",
  },
  {
    q: "Can I review a product?",
    a: "Yes, once your order for it has been paid — the review form appears on the product page for anyone who's purchased it.",
  },
];

function FaqPage() {
  return (
    <StaticPageLayout title="Frequently asked questions" icon={HelpCircleIcon}>
      <div className="space-y-4">
        {FAQS.map(({ q, a }) => (
          <div key={q} className="collapse-arrow collapse rounded-box border border-base-300 bg-base-100">
            <input type="checkbox" />
            <div className="collapse-title text-base font-semibold text-base-content">{q}</div>
            <div className="collapse-content text-sm text-base-content/70">
              <p>{a}</p>
            </div>
          </div>
        ))}
      </div>
    </StaticPageLayout>
  );
}

export default FaqPage;
