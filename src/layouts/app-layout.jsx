import { Outlet } from "react-router-dom";

const AppLayout = () => {
  return (
    <div>
      {/* header */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
