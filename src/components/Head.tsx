import { useState } from "react";

import { X } from "react-feather";
import { useLocation, useNavigate } from "react-router-dom";

import { ReactComponent as Menu } from "../assets/svg/menu.svg";
import routes from "../route/router";

const Head = () => {
  // router
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const currentPageIdx = routes.findIndex((page) => page.path === pathname);

  const [openMenu, setOpenMenu] = useState<boolean>(false);

  const MenuList = (flat: boolean): JSX.Element[] =>
    routes.map((page, idx) => (
      <li
        key={idx}
        className={`flex gap-2 hover:text-blue ${
          page.classTag
        } cursor-pointer p-3 ${currentPageIdx === idx && "active"}`}
        onClick={() => {
          navigate(page.path);

          if (flat) {
            setOpenMenu(false);
          }
        }}
      >
        {page.name}
      </li>
    ));

  return (
    <div>
      <header
        className="relative top-0 z-50 grid w-full grid-cols-[max-content_minmax(465px,_max-content)]
        justify-between px-5 py-4 flat:grid-cols-[repeat(2,_max-content)]
        "
      >
        <div
          className={`rounded-large bg-white px-8 py-4 shadow-base flat:p-[12px_16px] ${
            openMenu && "shadow-none"
          }`}
        >
          <img
            className="flat:w-[92px]"
            src={`${process.env.PUBLIC_URL}/images/logo.png`}
            alt="Logo"
          />
        </div>
        <nav className="flex items-center justify-between rounded-large bg-white pr-2 pl-12 shadow-base flat:hidden">
          <ul className="menu grid grid-cols-3 gap-12 text-black/50 ">
            {MenuList(false)}
          </ul>
          <div className="rounded-full p-1 outline outline-1 outline-black/20">
            <img src={`${process.env.PUBLIC_URL}/images/user.png`} alt="user" />
          </div>
        </nav>
        <div className="hidden flat:block ">
          <button
            type="button"
            className="h-full rounded-large bg-white px-4 py-3"
            onClick={() => setOpenMenu(!openMenu)}
          >
            {openMenu ? <X strokeWidth="1" /> : <Menu />}
          </button>
        </div>
      </header>
      <ul
        className={`menu absolute left-0 top-0 z-40 hidden w-full flex-col items-center gap-6 bg-white text-black/50 flat:flex ${
          openMenu
            ? "scale-up-top-right pt-24 pb-16"
            : "scale-down-top-right origin-top-right"
        } `}
      >
        {openMenu && (
          <div>
            {MenuList(true)}
            <div className="mt-4 flex items-center gap-2">
              <div className="rounded-full p-1 outline outline-1 outline-black/20">
                <img
                  src={`${process.env.PUBLIC_URL}/images/user.png`}
                  alt="user"
                />
              </div>
              Membres
            </div>
          </div>
        )}
      </ul>
    </div>
  );
};

export default Head;
