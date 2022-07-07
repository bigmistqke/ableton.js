let i = 0;

function dragHelper(e, move_callback = () => { }) {
  return new Promise((resolve) => {
    let touch = e.touches[e.touches.length - 1];
    let pos = { x: touch.clientX, y: touch.clientY };
    let index = i;
    i++;

    const move_event = (e) => move_callback(e.targetTouches[0])
    const end_event = (e) => {
      e.target.removeEventListener("touchmove", move_event, true);
      e.target.removeEventListener("touchend", end_event, true);
      resolve();
    }

    e.target.addEventListener("touchmove", move_event, true);
    e.target.addEventListener("touchend", end_event, true)
  })

}
export default dragHelper;