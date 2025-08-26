import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/ThemeProvider"

export function SimpleThemeToggle() {
  const { setTheme, theme } = useTheme()

  const toggleTheme = () => {
    if (theme === "system") {
      // If system theme, check what the system preference is and toggle to opposite
      const systemIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setTheme(systemIsDark ? "light" : "dark")
    } else {
      // Toggle between light and dark
      setTheme(theme === "light" ? "dark" : "light")
    }
  }

  const getCurrentIcon = () => {
    if (theme === "system") {
      const systemIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      return systemIsDark ? <Moon className="h-[1.2rem] w-[1.2rem]" /> : <Sun className="h-[1.2rem] w-[1.2rem]" />
    }
    return theme === "light" ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />
  }

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={toggleTheme}
      className="relative border-2 hover:shadow-glow transition-all duration-300"
    >
      <div className="transition-all duration-300">
        {getCurrentIcon()}
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}