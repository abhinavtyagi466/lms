import { Toaster as Sonner, ToasterProps } from "sonner";
import { useTheme } from "../../contexts/ThemeContext";

const Toaster = ({ ...props }: ToasterProps) => {
  const { isDarkMode } = useTheme();

  return (
    <Sonner
      theme={isDarkMode ? "dark" : "light"}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
