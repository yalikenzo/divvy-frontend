import { useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { useAuth } from "../hooks/useAuth";
import { cn } from "../utils/cn";

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 shrink-0">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M18 12h-9m0 0 3-3m-3 3 3 3"
    />
  </svg>
);

export function MobileBrandAndLogout({ className }) {
  const navigate = useNavigate();
  const { logout: clearAuthSession } = useAuth();

  const handleLogout = () => {
    authApi.logout();
    clearAuthSession();
    navigate("/", { replace: true });
  };

  return (
    <div
      className={cn(
        "sticky top-0 z-20 flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur-sm lg:hidden",
        className
      )}
    >
      <button
        type="button"
        onClick={() => navigate("/")}
        aria-label="Go to homepage"
        className="-mx-1 rounded-lg px-1 py-1 text-left text-lg font-bold tracking-wide text-[#101828] transition-colors hover:text-indigo-600 focus-visible:outline focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        Divvy
      </button>
      <button
        type="button"
        onClick={handleLogout}
        aria-label="Log out"
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#4a5565] transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <span className="text-red-600" aria-hidden="true">
          <LogoutIcon />
        </span>
        <span>Log out</span>
      </button>
    </div>
  );
}
