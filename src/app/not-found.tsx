import Box from "@/components/Box";
import Link from "next/link";

export default function NotFound() {
  return (
    <Box label="404">
      <p>&gt; no such page.</p>
      <p>
        <Link href="/">back to the scope</Link>
      </p>
    </Box>
  );
}
