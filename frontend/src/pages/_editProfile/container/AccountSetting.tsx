import React, { useEffect, useState } from "react";
import AccountEdit from "./AccountEdit";
import SecurityEdit from "./SecurityEdit";
import { FaUserEdit } from "react-icons/fa";
import { FaShield } from "react-icons/fa6";

type FilterType = "tous" | "privacy";

const AccountSetting: React.FC = () => {
  const [filtreActif, setFiltreActif] = useState<FilterType>("tous");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleFiltre = (type: FilterType) => {
    setFiltreActif(type);
  };

  const contenuFiltre: { [key in FilterType]: JSX.Element } = {
    tous: <AccountEdit />,
    privacy: <SecurityEdit />,
  };

  return (
    <div className="flex flex-row h-[80vh]" style={{ cursor: "default" }}>
      {/*NAV SETTINGS*/}
      <div className="w-[66px] md:w-[260px] md:rounded-l-lg bg-violet-black">
        <div className="p-4">
          <h1 className="font-outline-2 mt-6 m-2 text-white md:block hidden">Settings</h1>
        </div>

        <nav>
          <ul className="mt-2 ml-4 md:ml-10">
            <li
              className={`mb-2 text-sm text-lilac ${
                filtreActif === "tous"
                  ? "bg-violet-black-nav py-2 pl-4 rounded-l-md"
                  : "py-2 pl-4"
              }`}
              style={{ cursor: "pointer" }}
              onClick={() => handleFiltre("tous")}
            >
              {isMobile ? <FaUserEdit className="w-4 h-4"/> : "Profile and account"}
            </li>
            <li
              className={`mb-2 text-sm text-lilac ${
                filtreActif === "privacy"
                  ? "bg-violet-black-nav py-2 pl-4 rounded-l-md"
                  : "py-2 pl-4"
              }`}
              style={{ cursor: "pointer" }}
              onClick={() => handleFiltre("privacy")}
            >
              {isMobile ? <FaShield className="w-4 h-4"/> : "Password and Security"}
            </li>
          </ul>
        </nav>
      </div>

      {/*NAV FRIENDS*/}
      <div className="flex-1 bg-violet-black-nav bg-opacity-80 p-4 md:rounded-r-lg">
        {contenuFiltre[filtreActif]}
      </div>
    </div>
  );
};

export default AccountSetting;
