import { AlertTriangle, Check } from "react-feather";

export const MessageDefault: MessageType = {
  open: false,
  icon: "check",
  content: "",
};

export const MessageIcon: MessageIconType = {
  check: { icon: <Check size={16} strokeWidth={3.5} /> },
  warn: { icon: <AlertTriangle size={16} strokeWidth={3.5} /> },
};

export enum MessageTexts {
  create = "Créé",
  unopened = "En attente",
  sign_success = "Signé",
}
