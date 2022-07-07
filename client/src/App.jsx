import styles from "./App.module.css";
import { createEffect, createMemo, createSignal, For, onMount } from "solid-js";

import { AndroidFullScreen } from "@awesome-cordova-plugins/android-full-screen";
import createLocalStore from "@solid-primitives/local-store";

import { HIT, TRX, FX1, FX2, IP } from "./Panels";
import { KEYS, FIFTHS } from "./Intervals";

import WS from "./WS";

let url = "192.168.1.101";
const PORT = {
  ws: 8080,
  wss: 443,
  http: 4000,
};

function App() {
  const [map, setMap] = createSignal();
  const [backtrack, setBacktrack] = createSignal();
  const [hit, setHit] = createSignal();
  const [vox, setVox] = createSignal();
  const [autotune, setAutotune] = createSignal();
  const [panel, setPanel] = createSignal("TRX");
  const [fullscreen, setFullscreen] = createSignal(false);
  const [playingClip, setPlayingClip] = createSignal(false);

  const PANELS = ["TRX", /*  "FX1", "FX2", */ "HIT", "IP"];

  const [store, setStore] = createLocalStore("ip");
  // let ws = new WS(ws_url());

  /*   const ws_url = createMemo(
    () => `wss://${store.ip ? store.ip : url}:${PORT.ws}`
  ); */

  // let ws = new WebSocket(ws_url());

  AndroidFullScreen.immersiveMode();

  let ws = new WS();

  createEffect(() => {
    ws.connect(store.ip);
    ws.onreceive = (topic, data) => {
      console.log(topic, data);
      switch (topic) {
        case "init":
          initMapping(data);
          console.log("data is ", data);
          break;
      }
    };
  });

  function openFullscreen() {
    setFullscreen(true);
    if (document.body.requestFullscreen) {
      document.body.requestFullscreen();
    } else if (document.body.webkitRequestFullscreen) {
      document.body.webkitRequestFullscreen();
    } else if (document.body.msRequestFullscreen) {
      document.body.msRequestFullscreen();
    }
  }
  function closeFullscreen() {
    setFullscreen(false);
    document.exitFullscreen();
  }

  const initMapping = (data) => {
    console.log("initMapping", data);
    setBacktrack(data.TRX);
    // setVox(data.find(([track_name]) => track_name === "VOX"));
    setHit(data.HIT);
  };

  const init = async () => {
    console.log("init");
  };
  init();

  const sendFX = (fx) => ws.send("fx", fx);
  const sendPreset = (preset) => ws.send("preset", preset);

  const playClip = (index) => ws.send("play", index);
  const playHit = (index) => ws.send("hit", index);

  const updateAutotune = (key) =>
    ws.send("fx", ["VOX", "Auto-Tune Artist", "Key", KEYS[key] * 100]);

  const updateMenu = () => {};

  const requestFX = () => fetch(URL.http + "/requestFX");

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <For each={PANELS}>
          {(panel_name) => (
            <button
              class={panel() === panel_name ? styles.selected : ""}
              onClick={() => setPanel(panel_name)}
            >
              {panel_name}
            </button>
          )}
        </For>
      </header>
      <div
        class={styles.panel}
        style={{
          display: panel() === "TRX" ? "inline-block" : "none",
        }}
      >
        <TRX
          playClip={playClip}
          updateAutotune={updateAutotune}
          clips={backtrack() ? backtrack().clips : undefined}
          playingClip={playingClip()}
        />
      </div>
      <div
        class={styles.panel}
        style={{
          display: panel() === "FX1" ? "inline-block" : "none",
          height: "100%",
        }}
      >
        <FX1
          sendPreset={sendPreset}
          map={[vox(), backtrack()]}
          playingClip={playingClip()}
          requestFX={requestFX}
        />
      </div>
      <div
        class={styles.panel}
        style={{
          display: panel() === "FX2" ? "inline-block" : "none",
          height: "100%",
        }}
      >
        <FX2 sendFX={sendFX} map={[vox(), backtrack()]} />
      </div>
      <div
        class={styles.panel}
        style={{
          display: panel() === "HIT" ? "inline-block" : "none",
          height: "100%",
        }}
      >
        <HIT playHit={playHit} clips={hit() ? hit().clips : undefined} />
      </div>
      <div
        class={styles.panel}
        style={{
          display: panel() === "IP" ? "inline-block" : "none",
          height: "100%",
        }}
      >
        <IP
          setIP={(ip) => {
            setStore("ip", ip);
            console.log(store.ip);
          }}
          ip={store.ip}
        />
      </div>
    </div>
  );
}

export default App;
