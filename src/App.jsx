import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./App.css";
import AppLayout from "./layouts/app-layout";
import Home from "./pages/home";
import Categories from "./pages/categories";
import Search from "./pages/search";
import Favorites from "./pages/favorites";
import GifPage from "./pages/single-gif";
import GifProvider from "./context/gif-context";

//homepage
//categories
//search
//single gif
//favorites

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/:categories",
        element: <Categories />,
      },
      {
        path: "/search/:query",
        element: <Search />,
      },
      {
        path: "/:type/:slug",
        element: <GifPage />,
      },
      {
        path: "/favorites",
        element: <Favorites />,
      },
    ],
  },
]);

function App() {
  return (
    <GifProvider>
      <RouterProvider router={router} />
    </GifProvider>
  );
}

export default App;
