import { PopcornIcon } from "lucide-react"

import {
  Alert,
  AlertTitle,
} from "@/components/ui/alert"

export function Alertuse() {
  return (
    <div className="grid w-full max-w-xl items-start gap-4">
    
      <Alert>
        <PopcornIcon />
        <AlertTitle>
          This Alert has a title and an icon. No description.
        </AlertTitle>
      </Alert>
    
    </div>
  )
}
