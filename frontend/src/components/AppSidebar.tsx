import { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import {
  IconBrandTabler,
  IconUserBolt,
  IconTable,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

export default function AppSidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  
  const links = [
    {
      label: "Dashboard",
      href: "/",
      icon: (
        <IconBrandTabler className="h-5 w-5 shrink-0" />
      ),
    },
    {
      label: "Analytics",
      href: "/powerbi",
      icon: (
        <IconTable className="h-5 w-5 shrink-0" />
      ),
    },
    {
      label: "Upload Data",
      href: "/upload",
      icon: (
        <IconUserBolt className="h-5 w-5 shrink-0" />
      ),
    },
  ];

  const [open, setOpen] = useState(false);

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          <SidebarLogo />
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink
                key={idx}
                link={link}
                isActive={pathname === link.href}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-center pb-4">
          <ThemeToggleButton />
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

const SidebarLogo = () => {
  const { open, animate } = useSidebar();
  const { theme } = useTheme();
  
  return (
    <Link
      to="/"
      className="relative z-20 flex items-center justify-center py-3 px-2 rounded-lg hover:bg-white/5 transition-all duration-300"
    >
      <div className={`backdrop-blur-md px-3 py-2 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 shrink-0 ${
        theme === 'light'
          ? 'bg-gray-100/80 border border-gray-300'
          : 'bg-white/10 border border-white/20 hover:bg-white/15'
      }`}>
        <motion.img 
          src="https://cdn.dribbble.com/userupload/45564127/file/6c01b78a863edd968c45d2287bcd5854.png?resize=752x470&vertical=center" 
          alt="Drona Logo" 
          className="w-auto object-contain transition-transform duration-300"
          animate={{
            height: animate ? (open ? "50px" : "24px") : "50px",
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />
      </div>
    </Link>
  );
};

const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();
  const { open, animate } = useSidebar();
  
  const iconContent = theme === 'light' ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
  
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-start gap-2 group/sidebar px-3 py-2 rounded-lg cursor-pointer transition-all duration-300 hover:bg-white/10 w-full"
      aria-label="Toggle theme"
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <span className={cn(
        "shrink-0 transition-colors duration-300",
        "!text-[#1e3a8a] dark:!text-[#3b82f6] group-hover/sidebar:!text-white"
      )}>
        {iconContent}
      </span>
      <motion.span
        animate={{
          opacity: animate ? (open ? 1 : 0) : 1,
          width: animate ? (open ? "auto" : "0px") : "auto",
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          "text-sm group-hover/sidebar:translate-x-1 transition-all duration-300 whitespace-pre overflow-hidden",
          "!text-[#1e3a8a] dark:!text-[#3b82f6] group-hover/sidebar:!text-white",
          animate && !open && "hidden"
        )}
      >
        THEME
      </motion.span>
    </button>
  );
};

