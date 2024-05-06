import { Outlet } from "react-router-dom";

const AppLayout = () => {
  return (
    <div className="bg-gray-500 text-white min-h-screen">
      <div className="container px-6 py-4 mx-auto">
        {/* header */}
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
