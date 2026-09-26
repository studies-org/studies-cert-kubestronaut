import { CertDetailScreen } from "@/components/screens/cert-detail";
import { certs } from "@/lib/mock-data";

export function generateStaticParams() {
  return certs.map((c) => ({ code: c.code }));
}

export default async function CertDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <CertDetailScreen code={code} />;
}
