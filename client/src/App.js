import { BrowserRouter as Router, Routes, Route, } from "react-router-dom";
import Sidebar from "./component/Sidebar";
function App() {
  return (
    <Router>
      <div className=" min-h-screen"> 
        <Sidebar/>
        <div>
        </div>
      </div>
    </Router>
  );
}

export default App;