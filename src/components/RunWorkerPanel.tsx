import Box from "./Box";

const REPO = "https://github.com/soumyacodes007/arkiv-triggers";
const NPM = "https://www.npmjs.com/package/arkiv-triggers";

/** Static: no SDK calls, so this is a server-rendered panel. */
export default function RunWorkerPanel() {
  return (
    <Box label="RUN YOUR OWN WORKER">
      <p>
        The worker is open source (MIT). Anyone can run one, and any worker can fire any public rule, so
        no single operator decides what fires. A worker only runs the four actions on a fixed menu
        (telegram, webhook, receipt, extend) and never runs code from a rule.
      </p>
      <p>
        A worker needs only its <span className="warn">own</span> wallet with a little test GLM. It never
        needs your main wallet, and its key stays in your environment.
      </p>
      <pre className="code">{`# 1. make a fresh worker wallet (prints WORKER_KEY=0x…)
npx arkiv-triggers new-key

# 2. fund the printed address with test GLM from
#    https://hub.arkiv.network/faucet

# 3. run it
WORKER_KEY=0x… npx arkiv-triggers`}</pre>
      <p className="muted-small">
        Code:{" "}
        <a href={REPO} target="_blank" rel="noopener noreferrer">
          {REPO.replace("https://", "")}
        </a>
        <br />
        Package:{" "}
        <a href={NPM} target="_blank" rel="noopener noreferrer">
          {NPM.replace("https://", "")}
        </a>
      </p>
    </Box>
  );
}
