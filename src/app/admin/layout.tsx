import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-black">
        {/* Navigation - handles its own mobile/desktop views */}
        <AdminSidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto h-full p-4 md:p-12 relative overflow-x-hidden">
          {/* Subtle background glow for the admin area */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#ffaa00]/5 blur-[150px] rounded-full -z-10 pointer-events-none" />
          
          <div className="max-w-7xl mx-auto pb-20 md:pb-0">
            {children}
          </div>
        </main>
      </div>
  );
}
