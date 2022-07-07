const { Ableton } = require("ableton-js");

exports.AbletonWrapper = function () {
  const ableton = new Ableton();
  let map;

  let TRX, VOX, HIT, CTRL;

  const getClipsFromTrack = async (track) => {
    const clip_slots = await track.get("clip_slots");
    const clips = await Promise.all(clip_slots
      .map(async (clip_slot, index) => {
        if (!clip_slot.raw.has_clip) {
          return {
            clip_slot
          }
        }
        let clip = await clip_slot.get("clip");
        let clip_name = await clip.get("name");
        return {
          name: clip_name,
          clip_slot,
          clip,
          index
        }
      }))
    return clips/* .filter(clip => clip) */
  }

  const getParsFromFX = async (fx) => {
    let parameters = await fx.get("parameters");
    return parameters.map(v => ({
      name: v.raw.name,
      parameter: v
    }))

  }

  const getFxsFromTrack = async (track) => {
    let devices = await track.get("devices");
    return Promise.all(devices.map(async fx => {
      console.log("GET FX ");
      const fx_name = await fx.get("name");
      const parameters = await getParsFromFX(fx);
      return { name: fx_name, parameters };
    }))
  }

  this.playCtrlAtIndex = async (index) => map.CTRL.clips[index].clip_slot.fire()
  this.playHitAtIndex = async (index) => map.HIT.clips[index].clip_slot.fire()

  this.mapLive = async () => {
    try {
      const tracks = await ableton.song.get("tracks");
      const map_entries = await Promise.all(tracks.map(async t => {
        if (!t) throw 'track is undefined';
        const track_name = await t.get("name");
        const clips = await getClipsFromTrack(t);
        const fxs = await getFxsFromTrack(t)

        return ([
          track_name,
          { clips, fxs }
        ])
      }))
      map = Object.fromEntries(map_entries);
      console.log("MAP IS ", map);
      return map;

    } catch (err) {
      console.error(err);
      return false;
    }
  }

  this.serializeMap = () => {
    // filter out all the 'empty' clips
    // we will also only need the backing tracks and the 1-hit samples
    let serializedMap = {
      TRX: {
        clips: [...map.TRX.clips.filter(el => el.clip)],
        fxs: [...map.TRX.fxs]
      },
      HIT: {
        clips: map.HIT.clips.filter(el => el.clip),
        fxs: map.HIT.fxs
      }
    }
    for (let track_name in serializedMap) {
      const track = serializedMap[track_name];

      for (let index in track.clips) {
        const clip = { ...track.clips[index] };
        delete clip.clip;
        delete clip.clip_slot;
        track.clips[index] = clip;
      }
      for (let fx of track.fxs) {
        for (let index in fx.parameters) {
          const parameter = { ...fx.parameters[index] };
          delete parameter.parameter;
          fx.parameters[index] = parameter;
        }
      }
    }

    return serializedMap;
  }

  this.getTrack = (map, track) => map.find(([track_name]) => track_name === track)

  this.getPar = (map, track, fx, par) => {
    let [, [clips, fxs]] = this.getTrack(map, track);
    let [, parameters] = fxs.find(([fx_name]) => fx_name === fx);
    let [, parameter] = parameters.find(([par_name]) => par_name === par);
    return parameter;
  }

  this.getClip = (map, track, clip) => {
    try {
      let [, [clips, fxs]] = this.getTrack(map, track);
      return clips.find(([clip_name]) => clip_name === clip)[1];
    } catch (err) {
      console.error('getClip', err);
      return false;
    }

  }


  /*   this.playClip = async (map, track_name, clip_name) => {
      let clip = this.getClip(map, track_name, clip_name);
      await clip.set("is_playing", true);
    } */

  this.playClip = async (map, clip_name) => {
    const play = async (track_name) => {
      let clip = this.getClip(map, track_name, clip_name);
      if (clip)
        await clip.set("is_playing", true);
    }
    play("TRX");
    play("VOX");
  }

  this.setFX = (map, track, fx, par, value) => {
    let parameter = this.getPar(map, track, fx, par);
    parameter.set("value", value / 100);
  }

  this.setPreset = (map, track_name, preset) => {
    preset = JSON.parse(preset);
    preset.forEach(([fx_name, pars]) => {
      pars.forEach(([par_name, value]) => {
        let par = this.getPar(map, track_name, fx_name, par_name);
        par.set("value", value);
      })

    })

  }
}

