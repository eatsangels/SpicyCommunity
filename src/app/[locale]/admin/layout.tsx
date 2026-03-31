import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-black">
        {/* Sidebar - fixed on desktop */}
        <aside className="hidden md:block w-64 flex-shrink-0 border-r border-white/5 h-full overflow-y-auto">
          <AdminSidebar />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto h-full p-8 md:p-12 relative">
          {/* Subtle background glow for the admin area */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#ffaa00]/5 blur-[150px] rounded-full -z-10" />
          
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
  );
}
