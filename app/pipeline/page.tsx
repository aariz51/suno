import type { Metadata } from "next";
import { Pipeline } from "@/components/Pipeline";

export const metadata: Metadata = {
  title: "The pipeline — Suno",
  description:
    "A working CAP v1.2 reader, an independent risk scan that publishes where it disagrees with the official feed, and a per-channel delivery model. The machinery behind the warning screen.",
};

export default function PipelinePage() {
  return <Pipeline />;
}
