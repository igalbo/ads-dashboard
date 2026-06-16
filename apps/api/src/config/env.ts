import { z } from "zod";

const envSchema = z.object({
  API_PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  FRONTEND_ORIGIN: z.string().default("http://localhost:5173"),
  FACEBOOK_ADS_LIBRARY_URL: z
    .string()
    .url()
    .default(
      "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&is_targeted_country=false&media_type=all&search_type=page&sort_data[mode]=total_impressions&sort_data[direction]=desc&view_all_page_id=15087023444",
    ),
});

export const env = envSchema.parse(process.env);
