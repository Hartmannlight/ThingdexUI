import { Outlet } from "@tanstack/react-router";
import { Toasts } from "@/components/Toasts";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ScannerProvider } from "@/scanner/ScannerProvider";

const AppShell = () => (
  <ScannerProvider>
    <div className="terminal-shell">
      <Sidebar />
      <div className="terminal-shell__workbench">
        <TopBar />
        <main className="terminal-main">
          <Outlet />
        </main>
      </div>
      <Toasts />
    </div>
  </ScannerProvider>
);

export default AppShell;
