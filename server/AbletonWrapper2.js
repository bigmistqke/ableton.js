const { Ableton } = require("ableton-js");

exports.AbletonWrapper = function () {
  const ableton = new Ableton();
  this.mapLive = async () => {
    let tracks = await ableton.song.get("tracks");
    return Promise.all(tracks.map(async track => {
      let fxs = await track.get("devices");
      let clip_slots = await track.get("clip_slots");

      return [
        await track.get("name"),
        [
          await Promise.all(
            clip_slots.filter(clip_slot => clip_slot.raw.has_clip)
              .map(async clip_slot => {
                let clip = await clip_slot.get("clip");
                return [
                  await clip.get("name"),
                  clip
                ];
              })),
          await Promise.all(fxs.map(async device => {
            let parameters = await device.get("parameters");
            return [
              await device.get("name"),
              parameters.map(v => {
                return [
                  v.raw.name,
                  v
                ]
              })
            ];
          }))
        ]
      ]
    }))
  }

  this.serializeMap = (map) => map.map(([track_name, [clips, fxs]]) =>
    [
      track_name,

      [
        clips.map(([clip_name]) => clip_name),
        fxs.map(([fx_name, pars]) => [
          fx_name,
          pars.map(([par_name, par]) => [
            par_name,
            par.raw.value
          ])
        ])]
    ]
  )

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

