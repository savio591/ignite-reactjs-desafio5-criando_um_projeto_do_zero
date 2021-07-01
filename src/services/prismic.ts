import Prismic from '@prismicio/client';
import { DefaultClient } from '@prismicio/client/types/client';

export const prismicAccessToken = process.env.NEXT_PUBLIC_PRISMIC_ACCESS_TOKEN;

export function getPrismicClient(req?: unknown): DefaultClient {
  const prismic = Prismic.client(process.env.PRISMIC_API_ENDPOINT, {
    req,
    accessToken: prismicAccessToken,
  });

  return prismic;
}
