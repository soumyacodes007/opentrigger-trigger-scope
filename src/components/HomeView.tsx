"use client";

import Box from "./Box";
import FeedPanel from "./FeedPanel";
import FollowManager from "./FollowManager";
import WorkersTable from "./WorkersTable";
import RunWorkerPanel from "./RunWorkerPanel";
import { useFollows } from "@/lib/follows";

export default function HomeView() {
  const follows = useFollows();

  return (
    <>
      <section className="intro">
        <h1 className="title">
          TRIGGER SCOPE<span className="cursor" aria-hidden="true">_</span>
        </h1>
        <p className="dim">read-only explorer · Arkiv Tiramisu testnet · no wallet · no backend · open source</p>
        <p className="muted-small">
          Censorship resistant, open source, private, secure. Everything here is read from Arkiv by this page in
          your browser.
        </p>
      </section>

      <Box label="FOLLOWING">
        <FollowManager />
      </Box>

      <Box label="LIVE FEED">
        {follows.length === 0 ? (
          <p className="dim">
            Follow a creator above, search for one, or open any creator page. Its receipts stream in here, live.
          </p>
        ) : (
          <FeedPanel creators={follows} showCreator />
        )}
      </Box>

      <Box label="WORKERS">
        <WorkersTable limit={5} />
      </Box>

      <RunWorkerPanel />
    </>
  );
}
