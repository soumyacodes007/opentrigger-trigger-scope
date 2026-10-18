"use client";

import { MAX_FOLLOWS } from "@/lib/constants";
import { saveFollows, useFollows } from "@/lib/follows";
import { short } from "@/lib/format";

export default function FollowButton({ address }: { address: string }) {
  const follows = useFollows();
  const following = follows.includes(address);
  const full = !following && follows.length >= MAX_FOLLOWS;

  return (
    <div className="follow-row">
      <button
        type="button"
        className="crt-btn"
        aria-pressed={following}
        disabled={full}
        aria-label={`${following ? "Unfollow" : "Follow"} creator ${short(address, 8, 6)}`}
        onClick={() =>
          saveFollows(following ? follows.filter((a) => a !== address) : [...follows, address])
        }
      >
        {following ? "[ FOLLOWING ]" : "[ FOLLOW ]"}
      </button>
      {full && (
        <p className="muted-small">
          You follow the maximum of {MAX_FOLLOWS} creators. Unfollow one first.
        </p>
      )}
    </div>
  );
}
