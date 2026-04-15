import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function RaceDetail() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6 animate-slide-in">
      <Link to="/races">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          {t("common.back")}
        </Button>
      </Link>
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("raceDetail.title")}</p>
      </div>
    </div>
  );
}