import {
  initialize,
  ClipSlot,
  Track,
  Device,
  type ActivationContext,
  type Handle,
  type NoteDescription,
} from "@ableton-extensions/sdk";
import * as fs from "node:fs";
import * as path from "node:path";

// esbuild inlines this HTML file as a string (see the `.html` loader in build.ts).
import interfaceHtml from "./interface.html";

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const DIALOG_WIDTH = 520;
const DIALOG_HEIGHT = 720;
const FAVORITES_FILE = "favorites.json";
const ADSR_PARAMS = ["Attack", "Decay", "Sustain", "Release"] as const;

type LiveContext = {
  rootNote: number;
  scaleName: string;
  scaleIntervals: number[];
  scaleMode: boolean;
  tempo: number;
};

type FavoritesFile = { genres: string[]; progressions: unknown[]; theme?: "light" | "dark" };

type Adsr = { attack: number; decay: number; sustain: number; release: number };

type DialogResult = {
  action: "generate" | "save" | "cancel";
  notes?: NoteDescription[];
  lengthBeats?: number;
  clipName?: string;
  favorites?: FavoritesFile;
  adsr?: Adsr | null;
};

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
      const favorites = readFavorites();

      const raw = await context.ui.showModalDialog(
        buildDialogUrl(live, favorites),
        DIALOG_WIDTH,
        DIALOG_HEIGHT,
      );
      if (!raw) return;

      const result = JSON.parse(raw) as DialogResult;

      if (result.favorites && result.action !== "cancel") {
        writeFavorites(result.favorites);
      }

      if (result.action !== "generate") return;
      if (!result.notes || result.lengthBeats === undefined) return;

      if (clipSlot.clip) await clipSlot.deleteClip();
      const clip = await clipSlot.createMidiClip(result.lengthBeats);
      clip.notes = result.notes;
      if (result.clipName) clip.name = result.clipName;

      if (result.adsr) await applyAdsr(clipSlot, result.adsr);
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

  // ── Favorites persistence (storageDirectory is the fs-allowed path) ────────

  function favoritesPath(): string | undefined {
    const dir = context.environment.storageDirectory;
    return dir ? path.join(dir, FAVORITES_FILE) : undefined;
  }

  function readFavorites(): FavoritesFile {
    const empty: FavoritesFile = { genres: [], progressions: [], theme: "light" };
    const file = favoritesPath();
    if (!file) return empty;
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<FavoritesFile>;
      return {
        genres: Array.isArray(parsed.genres) ? parsed.genres : [],
        progressions: Array.isArray(parsed.progressions) ? parsed.progressions : [],
        theme: parsed.theme === "dark" ? "dark" : "light",
      };
    } catch {
      return empty;
    }
  }

  function writeFavorites(favorites: FavoritesFile): void {
    const file = favoritesPath();
    if (!file) return;
    try {
      fs.writeFileSync(file, JSON.stringify(favorites, null, 2), "utf8");
    } catch (error) {
      console.warn("[cpfd] could not save favorites:", error);
    }
  }

  // ── Best-effort ADSR: only if the slot's instrument exposes named params ───

  async function applyAdsr(clipSlot: ClipSlot<"1.0.0">, adsr: Adsr): Promise<void> {
    try {
      const parent = clipSlot.parent;
      if (!(parent instanceof Track)) return;
      const instrument = findInstrument(parent.devices);
      if (!instrument) return;

      const wanted: Record<(typeof ADSR_PARAMS)[number], number> = {
        Attack: adsr.attack,
        Decay: adsr.decay,
        Sustain: adsr.sustain,
        Release: adsr.release,
      };

      await context.withinTransaction(() =>
        Promise.all(
          ADSR_PARAMS.flatMap((name) => {
            const param = instrument.parameters.find((p) => p.name === name);
            if (!param) return [];
            const value = param.min + (param.max - param.min) * clamp01(wanted[name]);
            return [param.setValue(value)];
          }),
        ),
      );
    } catch {
      // Best-effort only — silently skip when the instrument has no ADSR params.
    }
  }

  function findInstrument(devices: Device<"1.0.0">[]): Device<"1.0.0"> | undefined {
    return devices.find((d) => {
      const names = new Set(d.parameters.map((p) => p.name));
      return ADSR_PARAMS.filter((n) => names.has(n)).length >= 3;
    });
  }

  function clamp01(v: number): number {
    return Math.max(0, Math.min(1, v));
  }

  function buildDialogUrl(live: LiveContext, favorites: FavoritesFile): string {
    const data = JSON.stringify({ live, favorites }).replace(/</g, "\\u003c");
    const html = interfaceHtml.replace("__APP_DATA__", data);
    return `data:text/html,${encodeURIComponent(html)}`;
  }
}
