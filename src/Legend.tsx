import React, { useContext } from "react";
import { getColorForString } from "./utils/color";
// @ts-ignore
import styles from "./Legend.module.css";
import { TimelineDataContext } from './hooks/TimelineData'

export default function Legend() {
  const timelineData = useContext(TimelineDataContext)!
  const {namesArray, nameToAvatarMap } = timelineData.team;

  return (
    <ul className={styles.List} data-testname="Legend-list">
      {namesArray.sort().map((name) => {
        const avatar = nameToAvatarMap.get(name);
        return (
          <li key={name} className={styles.ListItem}>
            <span
              className={styles.ColorChip}
              style={{ backgroundColor: getColorForString(name) }}
            >
              {avatar && (
                <img className={styles.AvatarImage} src={avatar} alt="Avatar" />
              )}
            </span>{" "}
            <span className={styles.ItemName}>{name}</span>
          </li>
        );
      })}
    </ul>
  );
}
