import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Navbar from "./component/Navbar";
import Login from "./page/Login";
import Sidebar from "./component/Sidebar";
import { useState } from "react";
function App() {
  const [openMenu,setOpenMenu]=useState(true)
  return (
    <Router>
      <div className=" min-h-screen"> 
        <Navbar menu={setOpenMenu} open={openMenu}/>
        <Sidebar open={openMenu} />
        <div>
          <Routes>
            <Route path="/page/Login" element={<Login/>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;