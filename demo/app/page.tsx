import type { Metadata } from "next";
import { ProtocolDemo } from "./ProtocolDemo";

export const metadata: Metadata = {
  title: "DreamNet Institutional Journey",
  description:
    "A five-minute guided demonstration of how accountable agent work becomes portable, independently verified knowledge.",
};

export default function Home() {
  return <ProtocolDemo />;
}
