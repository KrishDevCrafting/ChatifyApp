import { BrowserRouter, Routes, Route,Navigate } from "react-router-dom";

import Login from "./Login.jsx";
import HomePage from "./home/Homepage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login"/>} />
        <Route path="/login" element={<Login />} />

        {/* <Route path="/register" element={<Register />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;