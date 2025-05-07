import { BrowserRouter as Router, Routes, Route, } from "react-router-dom";
import Login from "./page/Login";
import Sidebar from "./component/Sidebar";
function App() {
  return (
    <Router>
      <div className=" min-h-screen"> 
        <Sidebar/>
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