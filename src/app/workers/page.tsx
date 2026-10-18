import Box from "@/components/Box";
import WorkersTable from "@/components/WorkersTable";

export default function WorkersPage() {
  return (
    <>
      <h1 className="title page-title">WORKERS</h1>
      <p className="dim">Every worker seen on Arkiv, with the open-source release each one runs.</p>
      <Box label="ALL WORKERS">
        <WorkersTable />
      </Box>
    </>
  );
}
