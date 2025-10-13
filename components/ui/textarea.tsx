import * as React from "react";
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={"w-full border rounded-xl px-3 py-2 text-sm min-h-[100px] " + (props.className || "")} />;
}
