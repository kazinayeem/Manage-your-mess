import { getTranslations } from "next-intl/server";
import { NotFoundView } from "@/components/errors/not-found-view";

export default async function MessNotFoundPage() {
  const t = await getTranslations("notFound");
  const tCommon = await getTranslations("common");

  return (
    <NotFoundView
      embedded
      title={t("title")}
      description={t("description")}
      hint={t("hint")}
      homeLabel={t("home")}
      portalLabel={t("portal")}
      backLabel={t("back")}
      contactLabel={t("contact")}
      pricingLabel={tCommon("viewPricing")}
      appName={tCommon("appName")}
    />
  );
}
