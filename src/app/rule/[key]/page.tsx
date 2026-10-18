import { Suspense } from "react";
import Loading from "@/components/Loading";
import RuleView from "@/components/RuleView";

export default function RulePage({ params }: { params: Promise<{ key: string }> }) {
  return (
    <>
      <h1 className="title page-title">RULE AUDIT</h1>
      <Suspense fallback={<Loading label="reading rule from Arkiv" />}>
        <RuleLoader params={params} />
      </Suspense>
    </>
  );
}

async function RuleLoader({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return <RuleView ruleKey={key} />;
}
