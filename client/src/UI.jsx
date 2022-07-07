import styles from "./UI.module.css";

export const Slider = (props) => {
  return (
    <div class={styles.slider} ref={props.ref}>
      <span
        class={styles.slider_handle}
        style={{
          bottom:
            ((props.value - props.min) / (props.max - props.min)) * 100 + "%",
        }}
      />
      <span />
    </div>
  );
};
