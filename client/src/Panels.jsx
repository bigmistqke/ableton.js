import { createEffect, createMemo, createSignal, For } from "solid-js";
import createLocalStore from "@solid-primitives/local-store";

import styles from "./Panels.module.css";

import { KEYS, FIFTHS } from "./Intervals";
import { Slider } from "./UI";
import dragHelper from "./dragHelper";

export const HIT = function (props) {
  createEffect(() => console.log("clips are ", props.clips));
  return (
    <div class={styles.clips}>
      <For each={props.clips}>
        {({ name, index }) => (
          <div class={styles.clip}>
            <button onClick={() => props.playHit(index)}>
              {name.toUpperCase()}
            </button>
          </div>
        )}
      </For>
    </div>
  );
};

export const TRX = function (props) {
  createEffect(() => console.log("clips are ", props.clips));
  return (
    <div class={styles.clips}>
      <For each={props.clips}>
        {({ name, index }) => (
          <div class={styles.clip}>
            <button onClick={() => props.playClip(index)}>
              {name.toUpperCase()}
            </button>
          </div>
        )}
      </For>
    </div>
  );
};

export const FX1 = (props) => {
  const TYPES = ["intro", "verse", "chorus", "bridge"];
  const [startPress, setStartPress] = createSignal(0);
  const [portalOpened, setPortalOpened] = createSignal(false);
  const [type, setType] = createSignal(false);
  const [flash, setFlash] = createSignal(false);
  const [storedFX1, setStoredFX1] = createLocalStore("FX1");

  let time_out;

  createEffect(() => {
    console.log(JSON.parse(storedFX1[type()]));
  });

  const mapFX = async (type) => {
    try {
      let response = await props.requestFX();
      response = await response.json();
      const vox = response.find(([name]) => name === "VOX");
      if (!vox) throw "can not find VOX-track";
      const [clips, fxs] = vox[1];
      setStoredFX1(type, JSON.stringify(fxs));
    } catch (e) {
      console.error(e);
    }
  };

  const animateFlash = (index = 0, bool = true) => {
    if (index > 1) return;
    setFlash(bool);
    setTimeout(() => animateFlash(index + 1, !bool), 500);
  };

  const touchDown = (type) => {
    setType(type);
    time_out = setTimeout(() => {
      mapFX(type);
      time_out = undefined;
      animateFlash();
    }, 1500);
  };
  const touchUp = (type) => {
    if (time_out) {
      clearTimeout(time_out);
      if (!storedFX1[type]) return;
      console.log("trigger fx");
      props.sendPreset(["VOX", storedFX1[type]]);
    }
  };

  return (
    <div class={styles.clips}>
      <For each={TYPES}>
        {(t) => (
          <button
            classList={{
              [styles.clip]: true,
              [styles.selected]: flash() && type() === t,
            }}
            onmousedown={() => touchDown(t)}
            onmouseup={() => touchUp(t)}
          >
            {t.toUpperCase()}
          </button>
        )}
      </For>
    </div>
  );
};

const FX_slider = (props) => {
  let _s;
  const [value, setValue] = createSignal(props.value);

  const updateValue = (value) => {
    setValue(value);
    props.sendFX([...props.path, value * 100]);
  };

  const initTracking = async (e) => {
    let last_tick;

    const index = e.touches.length - 1;
    let last_position = e.touches[index].clientY;
    await dragHelper(e, (touch) => {
      if (performance.now() - last_tick < 1000 / 60) return;
      last_tick = performance.now();
      let offset = last_position - touch.clientY;
      offset /= _s.offsetHeight;
      offset *= props.options.max;
      setValue((v) =>
        Math.max(props.options.min, Math.min(props.options.max, v + offset))
      );
      updateValue(value());
      last_position = touch.clientY;
    });
  };

  return (
    <div class={styles.fx} onTouchStart={initTracking}>
      <label>{parseInt(value() * 100) / 100}</label>
      <Slider
        ref={_s}
        value={value()}
        max={props.options.max}
        min={props.options.min}
        updateValue={updateValue}
      ></Slider>
      <label>{props.options.name}</label>
    </div>
  );
};

export const FX2 = (props) => {
  const SELECTION = [
    {
      path: ["VOX", "OrilRiver", "Decay time"],
      options: { min: 0, max: 1, name: "VOX REV DEC" },
    },
    {
      path: ["VOX", "OrilRiver", "Wet"],
      options: { min: 0, max: 1, name: "VOX REV WET" },
    },
    {
      path: ["VOX", "Lo-PassFilter", "Frequency"],
      options: { min: 20, max: 135, name: "VOX LPF FRQ" },
    },
    {
      path: ["TRX", "OrilRiver", "Decay time"],
      options: { min: 0, max: 1, name: "TRX REV DEC" },
    },
    {
      path: ["TRX", "OrilRiver", "Wet"],
      options: { min: 0, max: 1, name: "TRX REV WET" },
    },
    {
      path: ["TRX", "Echo", "Dry Wet"],
      options: { min: 0, max: 1, name: "TRX DEL WET" },
    },
    {
      path: ["TRX", "Echo", "Feedback"],
      options: { min: 0, max: 1, name: "TRX DEL FDB" },
    },
    {
      path: ["TRX", "Echo", "L Time"],
      options: { min: 0, max: 1, name: "TRX DEL TIM" },
    },
    // ["BACKING TRACK", "Lo-PassFilter", "Frequency"],
  ];

  const fxs = createMemo(() => {
    if (!props.map[0] || !props.map[1]) return;

    let fxs = SELECTION.map(
      ({ path: [track_name, fx_name, par_name], options }) => [
        [track_name, fx_name, par_name],
        props.map
          .find(([t]) => t === track_name)[1][1]
          .find(([f]) => f === fx_name)[1]
          .find(([p]) => {
            return p === par_name;
          })[1],
        options,
      ]
    );
    return fxs;
  });

  return (
    <div class={styles.fxs}>
      <For each={fxs()}>
        {([path, value, options]) => (
          <FX_slider
            path={path}
            value={value}
            options={options}
            sendFX={props.sendFX}
          />
        )}
      </For>
    </div>
  );
};

export const IP = (props) => {
  console.log(props);
  let ref;

  return (
    <div class={styles.IP}>
      <div>
        <label>IP</label>
        <input ref={ref} type="text" value={props.ip}></input>
        <button
          onClick={() => {
            props.setIP(ref.value);
            console.log(ref.value);
          }}
        >
          apply
        </button>
      </div>
    </div>
  );
};
