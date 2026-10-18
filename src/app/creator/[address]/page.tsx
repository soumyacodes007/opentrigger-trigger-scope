import { Suspense } from "react";
import CreatorView from "@/components/CreatorView";
import Loading from "@/components/Loading";

export default function CreatorPage({ params }: { params: Promise<{ address: string }> }) {
  return (
    <>
      <h1 className="title page-title">CREATOR FEED</h1>
      <Suspense fallback={<Loading label="opening creator" />}>
        <CreatorLoader params={params} />
      </Suspense>
    </>
  );
}

async function CreatorLoader({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  return <CreatorView address={address} />;
}
