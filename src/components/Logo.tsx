import logoAsset from "@/assets/filmak-logo.png.asset.json";
import { useLocale } from "@/lib/i18n";

type Props = {
  size?: number;
  withWordmark?: boolean;
  wordmarkClassName?: string;
  className?: string;
};

export function Logo({
  size = 32,
  withWordmark = true,
  wordmarkClassName = "text-xl font-bold",
  className = "",
}: Props) {
  const { t } = useLocale();
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src={logoAsset.url}
        alt={t("brand")}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="object-contain shrink-0"
      />
      {withWordmark && <span className={wordmarkClassName}>{t("brand")}</span>}
    </span>
  );
}