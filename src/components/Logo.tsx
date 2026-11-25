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
        src="/icon-192.png"
        srcSet="/icon-192.png 1x, /icon-512.png 2x"
        alt={`${t("brand")} logo`}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="object-contain shrink-0"
        decoding="async"
      />
      {withWordmark && <span className={wordmarkClassName}>{t("brand")}</span>}
    </span>
  );
}
