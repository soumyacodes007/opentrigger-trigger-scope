"use client";

import Link from "next/link";
import Box from "./Box";
import FeedPanel from "./FeedPanel";
import FollowButton from "./FollowButton";
import { ADDRESS_RE, explorerAddress } from "@/lib/format";

export default function CreatorView({ address }: { address: string }) {
  const creator = address.toLowerCase();

  if (!ADDRESS_RE.test(creator)) {
    return (
      <Box label="NOT A CREATOR ADDRESS">
        <p>
          &quot;{address.slice(0, 80)}&quot; is not a wallet address. A creator address is 0x followed by 40 hex
          characters.
        </p>
        <p>
          <Link href="/">back to the scope</Link>
        </p>
      </Box>
    );
  }

  return (
    <>
      <Box label="CREATOR">
        <p>
          wallet{" "}
          <a href={explorerAddress(creator)} target="_blank" rel="noopener noreferrer">
            {creator}
          </a>
        </p>
        <p className="muted-small">
          Receipts for the rules this wallet created. Each receipt names the worker that fired it, as recorded by
          Arkiv itself.
        </p>
        <FollowButton address={creator} />
      </Box>

      <Box label="LIVE FEED">
        <FeedPanel creators={[creator]} showCreator={false} />
      </Box>
    </>
  );
}
