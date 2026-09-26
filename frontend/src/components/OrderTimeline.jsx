import {
  BanIcon,
  CircleDotIcon,
  CreditCardIcon,
  PackageCheckIcon,
  PackageIcon,
  RotateCcwIcon,
  TruckIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatOrderWhen } from "../utils/format";
import { useLocale } from "../store/locale";

const STEP_ICON = {
  placed: PackageIcon,
  paid: CreditCardIcon,
  shipped: TruckIcon,
  delivered: PackageCheckIcon,
  cancelled: BanIcon,
  refunded: RotateCcwIcon,
};

const TERMINAL_TONE = {
  cancelled: "text-error",
  refunded: "text-base-content/50",
};

function buildSteps(order, statusEvents, t) {
  const steps = [
    { key: "placed", label: t("orderTimeline.orderPlaced"), at: order.createdAt },
    { key: "paid", label: t("orderTimeline.paymentConfirmed"), at: order.createdAt },
  ];

  for (const event of statusEvents) {
    steps.push({
      key: `${event.id}`,
      label: t("orderTimeline.marked", { status: t(`status.${event.toStatus}`) }),
      at: event.createdAt,
      note: event.note,
      tone: TERMINAL_TONE[event.toStatus],
      icon: STEP_ICON[event.toStatus],
    });
  }

  return steps;
}

const IN_PROGRESS_STATUSES = new Set(["paid", "shipped"]);

function OrderTimeline({ order, statusEvents }) {
  const { t } = useTranslation();
  const locale = useLocale((s) => s.locale);
  const steps = buildSteps(order, statusEvents, t);
  const inProgress = IN_PROGRESS_STATUSES.has(order.status);

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-base-content/60">
        {t("orderTimeline.title")}
      </h3>
      <ol className="space-y-4">
        {steps.map((step, i) => {
          const Icon = step.icon ?? STEP_ICON[step.key] ?? CircleDotIcon;
          const isLast = i === steps.length - 1;
          return (
            <li key={step.key} className="relative flex gap-3 pb-1">
              {!isLast || inProgress ? (
                <span
                  className="absolute left-3.5 top-7 h-full w-px bg-base-300"
                  aria-hidden
                />
              ) : null}
              <span
                className={`z-10 flex size-7 shrink-0 items-center justify-center rounded-full bg-base-200 ${
                  step.tone ?? "text-primary"
                }`}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className={`text-sm font-medium ${step.tone ?? "text-base-content"}`}>
                  {step.label}
                </p>
                <p className="text-xs text-base-content/50">{formatOrderWhen(step.at, { locale })}</p>
                {step.note ? (
                  <p className="mt-1 text-xs italic text-base-content/60">"{step.note}"</p>
                ) : null}
              </div>
            </li>
          );
        })}

        {inProgress ? (
          <li className="flex items-center gap-3 text-base-content/40">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-base-200">
              <CircleDotIcon className="size-4" aria-hidden />
            </span>
            <p className="text-sm">
              {order.status === "paid" ? t("orderTimeline.awaitingShipment") : t("orderTimeline.awaitingDelivery")}
            </p>
          </li>
        ) : null}
      </ol>
    </div>
  );
}

export default OrderTimeline;
