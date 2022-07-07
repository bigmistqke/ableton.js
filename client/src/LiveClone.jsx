import logo from "./logo.svg";
import styles from "./App.module.css";

import { createSignal, For, Show } from "solid-js";
const ws = new WebSocket("ws://localhost:8080");

const send = (topic, data) => {
  ws.send(JSON.stringify([topic, data]));
};

function FX(props) {
  const [opened, setOpened] = createSignal(false);

  return (
    <div style={{ "margin-left": "10px" }}>
      <button onClick={(e) => setOpened((v) => !v)}>{props.fx_name}</button>
      <Show when={opened()}>
        <For each={props.parameters}>
          {([par_name, par_value]) => (
            <div class={styles.fx}>
              <span style={{ width: "200px", display: "inline-block" }}>
                {par_name}
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={par_value * 100}
                class="slider"
                onInput={(e) => props.sendFX(par_name, e.target.value)}
              />
            </div>
          )}
        </For>
      </Show>
    </div>
  );
}

const FXs = function (props) {
  const [opened, setOpened] = createSignal(false);

  return (
    <div class={styles.fxs}>
      <button onClick={(e) => setOpened((v) => !v)}>FX</button>
      <Show when={opened()}>
        <For each={props.fxs}>
          {([fx_name, parameters]) => (
            <FX
              fx_name={fx_name}
              parameters={parameters}
              sendFX={(par, value) => props.sendFX(fx_name, par, value)}
            ></FX>
          )}
        </For>
      </Show>
    </div>
  );
};

const Clips = function (props) {
  const [opened, setOpened] = createSignal(false);

  return (
    <div class={styles.clips}>
      {/* <button onClick={(e) => setOpened((v) => !v)}>FX</button> */}
      {/* <Show when={opened()}> */}
      <For each={props.clips}>
        {(clip_name) => (
          <button class={styles.clip} onClick={() => props.playClip(clip_name)}>
            {clip_name}
          </button>
        )}
      </For>
      {/* </Show> */}
    </div>
  );
};

function App() {
  const [map, setMap] = createSignal();

  const init = async () => {
    ws.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      switch (data[0]) {
        case "init":
          console.log(data[1]);
          setMap(data[1]);
      }
    });
    console.log(ws);
  };
  init();

  const sendFX = (fx) => send("fx", fx);
  const playClip = (clip) => send("clip", clip);

  return (
    <div class={styles.App}>
      <For each={map()}>
        {([track_name, [clips, fxs]]) => (
          <div class={styles.track}>
            <div>{track_name}</div>
            <Clips
              clips={clips}
              playClip={(data) => playClip([track_name, data])}
            ></Clips>
            <FXs
              fxs={fxs}
              sendFX={(fx, par, value) => sendFX([track_name, fx, par, value])}
            ></FXs>
          </div>
        )}
      </For>
    </div>
  );
}

export default App;
