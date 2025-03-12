import { Link } from "react-router-dom";
import { useState } from "react";

const Navbar = ({menu,open}) => {
    const [isOpen, setOpen] = useState(false);
    const [location, setLocation] = useState("Ha Noi");
    return (
        <div className=" bg-white shadow-lg absolute w-full z-50">
            <nav className="flex flex-row items-center p-3 gap-4 font-medium  "> 
                <button
                    onClick={() => {
                        menu(!open)
                    }}
                    className="hover:opacity-30 "
                >
                    <img
                    className="h-8 w-8"
                    src="https://i.imgur.com/ghrAiTG_d.webp?maxwidth=128&shape=square"
                    ></img>
                </button>
                <Link 
                    className="hover:text-gray-400 border-2 rounded-md p-1 border-slate-300"
                    to="/"
                >
                    Home
                </Link>

                <div className="ml-auto">
                    <Link 
                        className="hover:text-gray-400 border-2 rounded-md p-1 border-slate-300" 
                        to="/page/Login"
                    >
                        Log In
                    </Link>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setOpen(!isOpen)}
                        className="hover:text-gray-600 focus:outline-none border-2 border-slate-300 rounded-md p-1"
                    >
                        Location: {location}
                    </button>
                    <div 
                        className={`absolute text-sm top-full left-0 mt-1 w-36 bg-white shadow-lg rounded-md z-30 transition-all duration-300 
                        ${isOpen ? " translate-y-0" : "opacity-0 -translate-y-2 "}`}
                    >
                        <button
                            onClick={() => { setLocation("Ha Noi"); setOpen(false); }}
                            className="block w-full px-4 py-2  hover:bg-slate-200"
                        >
                            Ha Noi
                        </button>
                        <button
                            onClick={() => { setLocation("Tp HCM"); setOpen(false); }}
                            className="block w-full px-4 py-2  hover:bg-slate-200"
                        >
                            Tp HCM
                        </button>
                        <button
                            onClick={() => { setLocation("Da Nang"); setOpen(false); }}
                            className="block w-full px-4 py-2 hover:bg-slate-200"
                        >
                            Da Nang
                        </button>
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default Navbar;
