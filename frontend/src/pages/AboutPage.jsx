import { InfoIcon } from "lucide-react";
import StaticPageLayout from "../components/StaticPageLayout";

function AboutPage() {
  return (
    <StaticPageLayout title="About Allure" icon={InfoIcon}>
      <p>
        Allure Supply curates hardware and workspace tools — audio, wearables,
        desk setups, cameras, travel gear, and the accessories that tie a
        setup together. We pick products we'd actually use, not just list
        whatever's trending.
      </p>
      <p>
        Every paid order comes with priority support: a private chat thread
        scoped to that order, and a video call link when our team wants to
        walk you through something in person.
      </p>
      <h2>What we care about</h2>
      <ul>
        <li>Clear specs and honest descriptions — no inflated claims.</li>
        <li>Fast, trackable fulfillment from order to delivery.</li>
        <li>Human support, not a ticket queue that goes nowhere.</li>
      </ul>
    </StaticPageLayout>
  );
}

export default AboutPage;
