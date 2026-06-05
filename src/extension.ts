import {
  initialize,
  ClipSlot,
  type ActivationContext,
  type Handle,
  type NoteDescription,
} from "@ableton-extensions/sdk";

// esbuild inlines this HTML file as a string (see the `.html` loader in build.ts).
import interfaceHtml from "./interface.html";

/**
 * SCAFFOLD — see docs/DECISIONS.md and docs/DESIGN.md for the agreed design.
 *
 * Current state: registers the context-menu entry and opens a placeholder dialog
 * so the extension loads in Live. The genre/mood engine, favorites, preview and
 * Advanced panel described in the docs are implemented in the next pass.
 */

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];

type LiveContext = {
  rootNote: number;
  scaleName: string;
  scaleIntervals: number[];
  scaleMode: boolean;
  tempo: number;
};

type GenerateResult =
  | { action: "generate"; notes: NoteDescription[]; lengthBeats: number; clipName: string }
  | { action: "cancel" };

const DIALOG_WIDTH = 560;
const DIALOG_HEIGHT = 720;

export function activate(activation: ActivationContext) {
  const context = initialize(activation, "1.0.0");

  context.commands.registerCommand("cpfd.open", (arg: unknown) => {
    void open(arg as Handle);
  });

  context.ui.registerContextMenuAction(
    "ClipSlot",
    "Chord Progression for Dummies…",
    "cpfd.open",
  );

  async function open(handle: Handle): Promise<void> {
    try {
      const clipSlot = context.getObjectFromHandle(handle, ClipSlot);
      const live = readLiveContext();

      const raw = await context.ui.showModalDialog(
        buildDialogUrl(live),
        DIALOG_WIDTH,
        DIALOG_HEIGHT,
      );
      if (!raw) return;

      const result = JSON.parse(raw) as GenerateResult;
      if (result.action !== "generate") return;

      if (clipSlot.clip) await clipSlot.deleteClip();
      const clip = await clipSlot.createMidiClip(result.lengthBeats);
      clip.notes = result.notes;
      clip.name = result.clipName;
    } catch (error) {
      console.error("[cpfd]", error);
    }
  }

  function readLiveContext(): LiveContext {
    const song = context.application.song;
    const intervals = song.scaleIntervals;
    return {
      rootNote: song.rootNote,
      scaleName: song.scaleName,
      scaleIntervals: intervals.length >= 3 ? intervals : MAJOR_SCALE,
      scaleMode: song.scaleMode,
      tempo: song.tempo,
    };
  }

  function buildDialogUrl(live: LiveContext): string {
    const data = JSON.stringify(live).replace(/</g, "\\u003c");
    const html = interfaceHtml.replace("__LIVE_DATA__", data);
    return `data:text/html,${encodeURIComponent(html)}`;
  }
}
