import { LoaderCircle } from "lucide-react";

type Props = {
  isStartingScrape: boolean;
  isVisible: boolean;
};

export function ScrapeStatusNotice({ isStartingScrape, isVisible }: Props) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="scrape-status" role="status" aria-live="polite">
      <LoaderCircle className="spinner" size={18} />
      {isStartingScrape ? "Starting scrape..." : "Scrape running. Refreshing results automatically..."}
    </div>
  );
}
