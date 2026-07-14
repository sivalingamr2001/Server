export const getButtonClass = (variant: string = "primary"): string => {
  const base = "px-4 py-2 text-sm font-medium rounded-md transition-colors"
  const styles: Record<string, string> = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/50",
    secondary:
      "border border-border bg-muted text-muted-foreground hover:bg-muted/80 disabled:bg-muted/60",
    danger:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:bg-destructive/60",
  }
  return `${base} ${styles[variant] || styles.primary}`
}
